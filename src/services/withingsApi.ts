export interface WithingsConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  isConnected: boolean;
}

interface WithingsAuthResponse {
  access_token: string;
  refresh_token: string;
  userid: string;
  scope: string;
  expires_in: number;
  token_type: string;
}

interface WithingsMeasurement {
  value: number;
  type: number;
  unit: number;
  date: number;
  category: number;
}

interface WithingsActivityData {
  date: string;
  steps: number;
  distance: number;
  calories: number;
  elevation: number;
  soft: number;
  moderate: number;
  intense: number;
  timezone: string;
}

interface WithingsSleepData {
  startdate: number;
  enddate: number;
  state: number;
  model: number;
  data: {
    wakeupduration: number;
    lightsleepduration: number;
    deepsleepduration: number;
    remsleepduration: number;
    durationtosleep: number;
    durationtowakeup: number;
    hr_average: number;
    hr_min: number;
    hr_max: number;
    rr_average: number;
    rr_min: number;
    rr_max: number;
  };
}

// Withings API measurement types
export const WITHINGS_MEASUREMENT_TYPES = {
  WEIGHT: 1,
  HEIGHT: 4,
  FAT_FREE_MASS: 5,
  FAT_RATIO: 6,
  FAT_MASS_WEIGHT: 8,
  DIASTOLIC_BLOOD_PRESSURE: 9,
  SYSTOLIC_BLOOD_PRESSURE: 10,
  HEART_PULSE: 11,
  TEMPERATURE: 12,
  SPO2: 54,
  BODY_TEMPERATURE: 71,
  SKIN_TEMPERATURE: 73,
  MUSCLE_MASS: 76,
  HYDRATION: 77,
  BONE_MASS: 88,
  PULSE_WAVE_VELOCITY: 91,
  VO2_MAX: 123,
} as const;

export class WithingsApiService {
  private config: WithingsConfig;
  private baseUrl = 'https://wbsapi.withings.net/v2';

  constructor(config: WithingsConfig) {
    this.config = config;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<WithingsAuthResponse> {
    const response = await fetch(`${this.baseUrl}/oauth2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        action: 'requesttoken',
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();
    
    if (data.status !== 0) {
      throw new Error(`Withings API Error: ${data.error}`);
    }

    return data.body;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<WithingsAuthResponse> {
    if (!this.config.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/oauth2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        action: 'requesttoken',
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
      }),
    });

    const data = await response.json();
    
    if (data.status !== 0) {
      throw new Error(`Withings API Error: ${data.error}`);
    }

    return data.body;
  }

  /**
   * Get measurements (weight, heart rate, blood pressure, etc.)
   */
  async getMeasurements(
    measurementTypes: number[],
    startDate?: Date,
    endDate?: Date
  ): Promise<WithingsMeasurement[]> {
    if (!this.config.accessToken) {
      throw new Error('No access token available');
    }

    const params = new URLSearchParams({
      action: 'getmeas',
      access_token: this.config.accessToken,
      meastype: measurementTypes.join(','),
    });

    if (startDate) {
      params.append('startdate', Math.floor(startDate.getTime() / 1000).toString());
    }
    if (endDate) {
      params.append('enddate', Math.floor(endDate.getTime() / 1000).toString());
    }

    const response = await fetch(`${this.baseUrl}/measure?${params}`);
    const data = await response.json();
    
    if (data.status !== 0) {
      throw new Error(`Withings API Error: ${data.error}`);
    }

    return data.body.measuregrps.flatMap((group: any) => 
      group.measures.map((measure: any) => ({
        ...measure,
        date: group.date,
        category: group.category,
      }))
    );
  }

  /**
   * Get activity data (steps, distance, calories)
   */
  async getActivityData(
    startDate?: Date,
    endDate?: Date
  ): Promise<WithingsActivityData[]> {
    if (!this.config.accessToken) {
      throw new Error('No access token available');
    }

    const params = new URLSearchParams({
      action: 'getactivity',
      access_token: this.config.accessToken,
    });

    if (startDate) {
      params.append('startdateymd', startDate.toISOString().split('T')[0]);
    }
    if (endDate) {
      params.append('enddateymd', endDate.toISOString().split('T')[0]);
    }

    const response = await fetch(`${this.baseUrl}/measure?${params}`);
    const data = await response.json();
    
    if (data.status !== 0) {
      throw new Error(`Withings API Error: ${data.error}`);
    }

    return data.body.activities;
  }

  /**
   * Get sleep data
   */
  async getSleepData(
    startDate?: Date,
    endDate?: Date
  ): Promise<WithingsSleepData[]> {
    if (!this.config.accessToken) {
      throw new Error('No access token available');
    }

    const params = new URLSearchParams({
      action: 'getsleep',
      access_token: this.config.accessToken,
    });

    if (startDate) {
      params.append('startdate', Math.floor(startDate.getTime() / 1000).toString());
    }
    if (endDate) {
      params.append('enddate', Math.floor(endDate.getTime() / 1000).toString());
    }

    const response = await fetch(`${this.baseUrl}/sleep?${params}`);
    const data = await response.json();
    
    if (data.status !== 0) {
      throw new Error(`Withings API Error: ${data.error}`);
    }

    return data.body.series;
  }

  /**
   * Get intraday activity data (continuous heart rate, steps per minute)
   */
  async getIntradayActivity(
    date: Date,
    dataFields: string[] = ['steps', 'heart_rate']
  ): Promise<any> {
    if (!this.config.accessToken) {
      throw new Error('No access token available');
    }

    const params = new URLSearchParams({
      action: 'getintradayactivity',
      access_token: this.config.accessToken,
      startdate: Math.floor(date.getTime() / 1000).toString(),
      enddate: Math.floor((date.getTime() + 24 * 60 * 60 * 1000) / 1000).toString(),
      datafields: dataFields.join(','),
    });

    const response = await fetch(`${this.baseUrl}/measure?${params}`);
    const data = await response.json();
    
    if (data.status !== 0) {
      throw new Error(`Withings API Error: ${data.error}`);
    }

    return data.body.series;
  }

  /**
   * Get workouts data using correct Withings API
   */
  async getWorkouts(
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    if (!this.config.accessToken) {
      throw new Error('No access token available');
    }

    // Use the official Withings getworkouts API endpoint
    const params = new URLSearchParams({
      action: 'getworkouts',
      access_token: this.config.accessToken,
    });

    // Try different date parameter formats
    if (startDate && endDate) {
      // First try YMD format
      params.append('startdateymd', startDate.toISOString().split('T')[0]);
      params.append('enddateymd', endDate.toISOString().split('T')[0]);
      
      console.log('Using YMD date format:', {
        startdateymd: startDate.toISOString().split('T')[0],
        enddateymd: endDate.toISOString().split('T')[0]
      });
    }

    console.log('Calling Withings getworkouts API:', {
      url: `${this.baseUrl}/measure?${params.toString()}`,
      params: Object.fromEntries(params.entries())
    });

    try {
      // Use GET method for workouts API (not POST like measurements)
      const response = await fetch(`${this.baseUrl}/measure?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'LifeCalendar/1.0'
        }
      });

      const data = await response.json();
      console.log('Withings getworkouts response:', data);
      console.log('RAW body content:', JSON.stringify(data.body, null, 2));
      
      // Check what fields exist in body
      if (data.body) {
        console.log('Available fields in body:', Object.keys(data.body));
      }

      if (data.status !== 0) {
        console.error('Withings API Error:', data.error);
        
        // If error with date params, try without date restrictions
        if (startDate && endDate) {
          console.log('Trying getworkouts without date parameters...');
          const paramsNoDate = new URLSearchParams({
            action: 'getworkouts',
            access_token: this.config.accessToken,
          });
          
          const response2 = await fetch(`${this.baseUrl}/measure?${paramsNoDate}`, {
            method: 'GET',
            headers: {
              'User-Agent': 'LifeCalendar/1.0'
            }
          });
          
          const data2 = await response2.json();
          console.log('Withings getworkouts response (no dates):', data2);
          console.log('RAW API body:', JSON.stringify(data2.body, null, 2));
          
          if (data2.status === 0) {
            const allWorkouts = data2.body?.workouts || [];
            console.log('All workouts from API (count):', allWorkouts.length);
            console.log('All workouts details:', JSON.stringify(allWorkouts, null, 2));
            
            // If no workouts at all, there might be a scope or API issue
            if (allWorkouts.length === 0) {
              console.warn('🚨 NO WORKOUTS FOUND IN API RESPONSE');
              console.warn('This could mean:');
              console.warn('1. No workouts recorded in Withings account');
              console.warn('2. Missing API scope for workout data');  
              console.warn('3. Workouts are stored in different endpoint');
              console.warn('4. Account needs additional permissions');
              return [];
            }
            
            // Filter workouts to match the requested date range
            const filteredWorkouts = allWorkouts.filter((workout: any) => {
              const workoutDate = new Date(workout.startdate * 1000);
              console.log('Checking workout date:', {
                workoutStartdate: workout.startdate,
                workoutDate: workoutDate.toISOString(),
                requestedStart: startDate.toISOString(), 
                requestedEnd: endDate.toISOString(),
                isInRange: workoutDate >= startDate && workoutDate <= endDate
              });
              return workoutDate >= startDate && workoutDate <= endDate;
            });
            
            console.log(`Filtered ${filteredWorkouts.length} workouts from ${allWorkouts.length} total for date range`);
            console.log('Filtered workouts:', JSON.stringify(filteredWorkouts, null, 2));
            return filteredWorkouts;
          }
        }
        
        // Don't throw error, just return empty array
        return [];
      }

      // Withings returns workouts in 'series' field, not 'workouts'!
      const rawWorkouts = data.body?.workouts || [];
      const seriesWorkouts = data.body?.series || [];
      
      console.log('Raw workouts field:', rawWorkouts);
      console.log('Series field (actual workouts):', seriesWorkouts);
      
      // Convert series to workout format - filter for actual workout categories
      const workoutCategories = [
        1,   // Promenad
        2,   // Löpning
        3,   // Simning
        8,   // Tennis
        9,   // Pingis
        10,  // Squash
        11,  // Badminton
        12,  // Padel
        13,  // Hockey
        14,  // Fotboll
        15,  // Basketball
        16,  // Styrketräning
        17,  // Cykling
        18,  // Elliptical
        19,  // Rodd
        20,  // Skidor
        21,  // Alpint
        22,  // Snowboard
        23,  // Skridskor
        24,  // Multisport
        25,  // Yoga
        26,  // Pilates
        27,  // Dans
        28,  // Boxning
        29,  // Fäktning
        30,  // Wrestling
        31,  // Kampsport
        32,  // Rock climbing
        33,  // Skidåkning
        34,  // Rullskridskor
        35,  // Golf
        36,  // Annan träning
        187, // Muskelträning
        188  // Konditionsträning
      ];
      
      const processedWorkouts = seriesWorkouts
        .filter((item: any) => workoutCategories.includes(item.category))
        .map((item: any) => {
          // Log the raw data to see what duration fields are available
          console.log('🏃 Raw workout data for duration analysis:', {
            id: item.id,
            category: item.category,
            categoryName: this.getWorkoutCategoryName(item.category),
            startdate: item.startdate,
            enddate: item.enddate,
            startDateTime: new Date(item.startdate * 1000).toLocaleString(),
            endDateTime: new Date(item.enddate * 1000).toLocaleString(),
            timeDiffSeconds: item.enddate - item.startdate,
            timeDiffMinutes: Math.round((item.enddate - item.startdate) / 60),
            data: item.data,
            dataKeys: item.data ? Object.keys(item.data) : [],
            allItemFields: Object.keys(item)
          });
          
          // Calculate workout duration: enddate - startdate (both in Unix seconds)
          const durationInSeconds = item.enddate - item.startdate;
          const duration = Math.round(durationInSeconds / 60); // Convert seconds to minutes
          
          console.log('💪 Duration calculation:', {
            startdate: item.startdate,
            enddate: item.enddate,
            durationInSeconds: durationInSeconds,
            durationInMinutes: duration,
            startTime: new Date(item.startdate * 1000).toLocaleTimeString(),
            endTime: new Date(item.enddate * 1000).toLocaleTimeString()
          });
          
          return {
            id: item.id,
            category: this.getWorkoutCategoryName(item.category),
            startdate: item.startdate,
            enddate: item.enddate,
            duration: duration,
            calories: Math.round(item.data?.manual_calories || item.data?.calories || 0),
            steps: item.data?.steps || 0,
            distance: Math.round((item.data?.distance || 0) / 1000 * 100) / 100, // Convert to km
            intensity: item.data?.intensity || 0,
            source: 'withings',
            rawData: item
          };
        });
      
      console.log('Processed workouts from series:', processedWorkouts);
      
      return processedWorkouts;
    } catch (error) {
      console.error('Network error calling Withings API:', error);
      return [];
    }
  }

  /**
   * Get workout category name from Withings category number
   */
  private getWorkoutCategoryName(category: number): string {
    const categories: Record<number, string> = {
      1: 'Promenad',
      2: 'Löpning', 
      3: 'Simning',
      4: 'Surfing',
      5: 'Kitesurfing',
      6: 'Windsurfing',
      7: 'Bodyboard',
      8: 'Tennis',
      9: 'Pingis',
      10: 'Squash',
      11: 'Badminton',
      12: 'Padel',
      13: 'Hockey',
      14: 'Fotboll',
      15: 'Basketball',
      16: 'Styrketräning',
      17: 'Cykling',
      18: 'Elliptical',
      19: 'Rodd',
      20: 'Skidor',
      21: 'Alpint',
      22: 'Snowboard',
      23: 'Skridskor',
      24: 'Multisport',
      25: 'Yoga',
      26: 'Pilates',
      27: 'Dans',
      28: 'Boxning',
      29: 'Fäktning',
      30: 'Wrestling',
      31: 'Kampsport',
      32: 'Rock climbing',
      33: 'Skidåkning',
      34: 'Rullskridskor',
      35: 'Golf',
      36: 'Annan träning',
      187: 'Muskelträning',
      188: 'Konditionsträning'
    };
    return categories[category] || `Träning (${category})`;
  }

  /**
   * Helper method to format measurement value based on unit
   */
  static formatMeasurementValue(value: number, unit: number): number {
    // Withings returns values with power-of-10 units
    // unit = -3 means value should be divided by 1000
    return value * Math.pow(10, unit);
  }

  /**
   * Convert measurement type to readable name
   */
  static getMeasurementTypeName(type: number): string {
    const typeNames: Record<number, string> = {
      [WITHINGS_MEASUREMENT_TYPES.WEIGHT]: 'Weight',
      [WITHINGS_MEASUREMENT_TYPES.HEIGHT]: 'Height',
      [WITHINGS_MEASUREMENT_TYPES.FAT_FREE_MASS]: 'Fat Free Mass',
      [WITHINGS_MEASUREMENT_TYPES.FAT_RATIO]: 'Fat Ratio',
      [WITHINGS_MEASUREMENT_TYPES.FAT_MASS_WEIGHT]: 'Fat Mass',
      [WITHINGS_MEASUREMENT_TYPES.DIASTOLIC_BLOOD_PRESSURE]: 'Diastolic BP',
      [WITHINGS_MEASUREMENT_TYPES.SYSTOLIC_BLOOD_PRESSURE]: 'Systolic BP',
      [WITHINGS_MEASUREMENT_TYPES.HEART_PULSE]: 'Heart Rate',
      [WITHINGS_MEASUREMENT_TYPES.TEMPERATURE]: 'Temperature',
      [WITHINGS_MEASUREMENT_TYPES.SPO2]: 'SpO2',
      [WITHINGS_MEASUREMENT_TYPES.MUSCLE_MASS]: 'Muscle Mass',
      [WITHINGS_MEASUREMENT_TYPES.HYDRATION]: 'Hydration',
      [WITHINGS_MEASUREMENT_TYPES.BONE_MASS]: 'Bone Mass',
      [WITHINGS_MEASUREMENT_TYPES.PULSE_WAVE_VELOCITY]: 'PWV',
      [WITHINGS_MEASUREMENT_TYPES.VO2_MAX]: 'VO2 Max',
    };

    return typeNames[type] || `Unknown (${type})`;
  }
}

/**
 * Factory function to create Withings API instance from localStorage config
 */
export function createWithingsApiFromConfig(): WithingsApiService | null {
  const configStr = localStorage.getItem('withings-config');
  if (!configStr) return null;

  const config = JSON.parse(configStr);
  if (!config.clientId || !config.clientSecret) return null;

  return new WithingsApiService(config);
}

/**
 * Health data aggregator that combines all Withings data sources
 */
export class WithingsHealthDataAggregator {
  private api: WithingsApiService;

  constructor(api: WithingsApiService) {
    this.api = api;
  }

  async getHealthDataForDate(date: Date, enabledMetrics: string[]): Promise<any> {
    const healthData: any = {};

    try {
      // Get measurements if any measurement types are enabled
      const measurementTypes = this.getMeasurementTypesFromConfig(enabledMetrics);
      if (measurementTypes.length > 0) {
        const measurements = await this.api.getMeasurements(
          measurementTypes,
          new Date(date.getTime() - 24 * 60 * 60 * 1000), // Yesterday
          new Date(date.getTime() + 24 * 60 * 60 * 1000)  // Tomorrow
        );
        
        healthData.measurements = this.processMeasurements(measurements);
      }

      // Get activity data if enabled
      if (enabledMetrics.some(m => ['steps', 'distance', 'calories', 'activeMinutes'].includes(m))) {
        const activities = await this.api.getActivityData(date, date);
        healthData.activity = activities[0] || null;
      }

      // Get sleep data if enabled
      if (enabledMetrics.some(m => m.startsWith('sleep'))) {
        const sleepData = await this.api.getSleepData(
          new Date(date.getTime() - 12 * 60 * 60 * 1000), // 12 hours before
          new Date(date.getTime() + 12 * 60 * 60 * 1000)  // 12 hours after
        );
        healthData.sleep = sleepData[0] || null;
      }

      // Get workouts if enabled - use official Withings workout API
      if (enabledMetrics.includes('workouts')) {
        console.log('Fetching workouts for date:', date.toISOString().split('T')[0]);
        
        // Use the official Withings workout API
        const workouts = await this.api.getWorkouts(date, date);
        console.log('Fetched workouts:', workouts);
        
        healthData.workouts = workouts;
      }

      return healthData;
    } catch (error) {
      console.error('Error fetching Withings health data:', error);
      throw error;
    }
  }

  private getMeasurementTypesFromConfig(enabledMetrics: string[]): number[] {
    const typeMap: Record<string, number> = {
      weight: WITHINGS_MEASUREMENT_TYPES.WEIGHT,
      fatMass: WITHINGS_MEASUREMENT_TYPES.FAT_MASS_WEIGHT,
      muscleMass: WITHINGS_MEASUREMENT_TYPES.MUSCLE_MASS,
      restingHeartRate: WITHINGS_MEASUREMENT_TYPES.HEART_PULSE,
      systolicBP: WITHINGS_MEASUREMENT_TYPES.SYSTOLIC_BLOOD_PRESSURE,
      diastolicBP: WITHINGS_MEASUREMENT_TYPES.DIASTOLIC_BLOOD_PRESSURE,
      vo2Max: WITHINGS_MEASUREMENT_TYPES.VO2_MAX,
    };

    return enabledMetrics
      .map(metric => typeMap[metric])
      .filter(type => type !== undefined);
  }

  private processMeasurements(measurements: WithingsMeasurement[]): Record<string, number> {
    const processed: Record<string, number> = {};

    measurements.forEach(measurement => {
      const value = WithingsApiService.formatMeasurementValue(measurement.value, measurement.unit);
      const typeName = WithingsApiService.getMeasurementTypeName(measurement.type);
      processed[typeName] = value;
    });

    return processed;
  }

}