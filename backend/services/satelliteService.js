const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class SatelliteService {
  constructor() {
    this.sentinelHubBaseUrl = 'https://services.sentinel-hub.com/api/v1';
    this.nasaEarthBaseUrl = 'https://api.nasa.gov/planetary/earth';
  }

  // Get access token for Sentinel Hub
  async getSentinelHubToken() {
    try {
      const response = await axios.post(
        `${this.sentinelHubBaseUrl}/oauth/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          auth: {
            username: process.env.SENTINEL_HUB_CLIENT_ID,
            password: process.env.SENTINEL_HUB_CLIENT_SECRET
          }
        }
      );
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting Sentinel Hub token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Sentinel Hub');
    }
  }

  // Fetch satellite image from Sentinel Hub
  async fetchSentinelImage(latitude, longitude, width = 1000, height = 1000) {
    try {
      const token = await this.getSentinelHubToken();
      
      // Define bounding box (roughly 1km x 1km around the point)
      const bbox = this.calculateBoundingBox(latitude, longitude, 0.01); // ~1km
      
      const requestBody = {
        input: {
          bounds: {
            bbox: bbox,
            properties: {
              crs: "http://www.opengis.net/def/crs/EPSG/0/4326"
            }
          },
          data: [{
            type: "sentinel-2-l2a",
            dataFilter: {
              timeRange: {
                from: this.getDateMonthsAgo(6), // Last 6 months
                to: new Date().toISOString().split('T')[0] + "T23:59:59Z"
              }
            }
          }]
        },
        output: {
          width: width,
          height: height,
          responses: [{
            identifier: "default",
            format: {
              type: "image/jpeg"
            }
          }]
        },
        evalscript: `
          //VERSION=3
          function setup() {
            return {
              input: ["B02", "B03", "B04"],
              output: { bands: 3 }
            };
          }
          
          function evaluatePixel(sample) {
            return [sample.B04 * 2.5, sample.B03 * 2.5, sample.B02 * 2.5];
          }
        `
      };

      const response = await axios.post(
        `${this.sentinelHubBaseUrl}/process`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      // Save image to local storage
      const filename = `satellite_${latitude}_${longitude}_${Date.now()}.jpg`;
      const imagePath = path.join('uploads', 'satellite', filename);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(imagePath), { recursive: true });
      await fs.writeFile(imagePath, response.data);

      return {
        imagePath: imagePath,
        imageUrl: `/uploads/satellite/${filename}`,
        source: 'sentinel-hub',
        coordinates: { latitude, longitude },
        boundingBox: bbox,
        captureDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Sentinel Hub API error:', error.response?.data || error.message);
      throw new Error('Failed to fetch satellite image from Sentinel Hub');
    }
  }

  // Fetch satellite image from NASA Earth API (fallback)
  async fetchNASAImage(latitude, longitude, dim = 0.1) {
    try {
      const url = `${this.nasaEarthBaseUrl}/imagery`;
      const params = {
        lon: longitude,
        lat: latitude,
        dim: dim, // Dimension in degrees
        api_key: process.env.NASA_API_KEY || 'DEMO_KEY'
      };

      const response = await axios.get(url, {
        params,
        responseType: 'arraybuffer'
      });

      // Save image to local storage
      const filename = `nasa_${latitude}_${longitude}_${Date.now()}.jpg`;
      const imagePath = path.join('uploads', 'satellite', filename);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(imagePath), { recursive: true });
      await fs.writeFile(imagePath, response.data);

      return {
        imagePath: imagePath,
        imageUrl: `/uploads/satellite/${filename}`,
        source: 'nasa-earth',
        coordinates: { latitude, longitude },
        dimension: dim,
        captureDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('NASA Earth API error:', error.response?.data || error.message);
      throw new Error('Failed to fetch satellite image from NASA Earth API');
    }
  }

  // Try multiple satellite sources
  async fetchSatelliteImage(latitude, longitude) {
    const startTime = Date.now();
    
    try {
      // Validate coordinates
      if (!this.isValidCoordinate(latitude, longitude)) {
        throw new Error('Invalid coordinates provided');
      }

      let result = null;
      
      // Try Sentinel Hub first (better quality)
      if (process.env.SENTINEL_HUB_CLIENT_ID && process.env.SENTINEL_HUB_CLIENT_SECRET) {
        try {
          result = await this.fetchSentinelImage(latitude, longitude);
        } catch (error) {
          console.warn('Sentinel Hub failed, trying NASA:', error.message);
        }
      }

      // Fallback to NASA Earth API
      if (!result) {
        result = await this.fetchNASAImage(latitude, longitude);
      }

      const processingTime = Date.now() - startTime;
      
      return {
        ...result,
        processingTime,
        metadata: {
          resolution: result.source === 'sentinel-hub' ? '10m' : '~1km',
          bands: result.source === 'sentinel-hub' ? 'RGB (B04, B03, B02)' : 'Natural Color'
        }
      };
    } catch (error) {
      console.error('All satellite services failed:', error.message);
      throw new Error(`Failed to fetch satellite imagery: ${error.message}`);
    }
  }

  // Helper functions
  calculateBoundingBox(lat, lon, delta) {
    return [
      lon - delta, // west
      lat - delta, // south
      lon + delta, // east
      lat + delta  // north
    ];
  }

  getDateMonthsAgo(months) {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date.toISOString().split('T')[0] + "T00:00:00Z";
  }

  isValidCoordinate(latitude, longitude) {
    return (
      typeof latitude === 'number' && 
      typeof longitude === 'number' &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }

  // Get satellite image metadata
  async getImageMetadata(latitude, longitude) {
    try {
      // For Sentinel Hub, we can get additional metadata
      if (process.env.SENTINEL_HUB_CLIENT_ID) {
        const token = await this.getSentinelHubToken();
        
        const requestBody = {
          input: {
            bounds: {
              bbox: this.calculateBoundingBox(latitude, longitude, 0.01),
              properties: {
                crs: "http://www.opengis.net/def/crs/EPSG/0/4326"
              }
            },
            data: [{
              type: "sentinel-2-l2a",
              dataFilter: {
                timeRange: {
                  from: this.getDateMonthsAgo(6),
                  to: new Date().toISOString().split('T')[0] + "T23:59:59Z"
                }
              }
            }]
          }
        };

        const response = await axios.post(
          `${this.sentinelHubBaseUrl}/catalog/search`,
          requestBody,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching metadata:', error.message);
      return null;
    }
  }
}

module.exports = new SatelliteService();