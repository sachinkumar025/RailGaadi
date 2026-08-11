import { env, isOpenWeatherConfigured } from '@/config/env';

export interface WeatherData {
  stationCode?: string;
  stationName?: string;
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  windSpeedKmh: number;
  condition: string; // e.g. "Clear", "Rain", "Clouds"
  icon: string;
  rainChancePercent?: number;
}

export async function getWeatherForLocation(
  lat: number,
  lng: number,
  stationName?: string,
  stationCode?: string
): Promise<WeatherData> {
  if (!isOpenWeatherConfigured()) {
    throw new Error('OPENWEATHER_NOT_CONFIGURED: OPENWEATHER_API_KEY is not configured in your environment.');
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${env.OPENWEATHER_API_KEY}`;
  const res = await fetch(url);
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`OpenWeather API error (${res.status}): ${errorText || res.statusText}`);
  }

  const data = await res.json();
  return {
    stationCode,
    stationName,
    tempC: Math.round(data.main.temp),
    feelsLikeC: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeedKmh: Math.round(data.wind.speed * 3.6),
    condition: data.weather[0]?.main || 'Clear',
    icon: data.weather[0]?.icon || '01d',
    rainChancePercent: data.rain ? 80 : 10,
  };
}

