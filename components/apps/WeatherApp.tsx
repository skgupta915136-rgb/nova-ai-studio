import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Wind, Thermometer, Droplets } from 'lucide-react';

interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  humidity: number;
  windSpeed: number;
  forecast: { day: string; temp: number; condition: string }[];
}

const WeatherApp: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking weather data for now, but in a real app we'd fetch from an API
    // or use Gemini to get it.
    setTimeout(() => {
      setWeather({
        temp: 24,
        condition: 'Partly Cloudy',
        location: 'San Francisco, CA',
        humidity: 65,
        windSpeed: 12,
        forecast: [
          { day: 'Mon', temp: 22, condition: 'Cloudy' },
          { day: 'Tue', temp: 25, condition: 'Sunny' },
          { day: 'Wed', temp: 23, condition: 'Rain' },
          { day: 'Thu', temp: 21, condition: 'Cloudy' },
          { day: 'Fri', temp: 26, condition: 'Sunny' },
        ]
      });
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        <p className="text-slate-400">Fetching local weather...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 rounded-2xl p-6 text-white space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold">{weather?.location}</h2>
          <p className="text-slate-400 text-lg">{weather?.condition}</p>
        </div>
        <div className="text-right">
          <div className="text-6xl font-light">{weather?.temp}°</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 p-4 rounded-xl flex flex-col items-center space-y-2">
          <Thermometer className="text-orange-400" size={20} />
          <span className="text-xs text-slate-400 uppercase">Feels Like</span>
          <span className="font-semibold">{weather!.temp + 2}°</span>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl flex flex-col items-center space-y-2">
          <Droplets className="text-blue-400" size={20} />
          <span className="text-xs text-slate-400 uppercase">Humidity</span>
          <span className="font-semibold">{weather?.humidity}%</span>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-xl flex flex-col items-center space-y-2">
          <Wind className="text-slate-400" size={20} />
          <span className="text-xs text-slate-400 uppercase">Wind</span>
          <span className="font-semibold">{weather?.windSpeed} mph</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase text-slate-500 tracking-wider">5-Day Forecast</h3>
        <div className="space-y-3">
          {weather?.forecast.map((f, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
              <span className="w-12 font-medium">{f.day}</span>
              <div className="flex items-center space-x-2">
                {f.condition === 'Sunny' && <Sun size={18} className="text-yellow-400" />}
                {f.condition === 'Cloudy' && <Cloud size={18} className="text-slate-400" />}
                {f.condition === 'Rain' && <CloudRain size={18} className="text-blue-400" />}
                <span className="text-sm text-slate-300">{f.condition}</span>
              </div>
              <span className="font-semibold">{f.temp}°</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherApp;
