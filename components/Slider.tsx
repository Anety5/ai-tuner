import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  valueLabel: string;
}


const Slider: React.FC<SliderProps> = ({ label, value, onChange, icon, valueLabel }) => {
  const inputId = `slider-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={inputId} className="flex items-center text-sm font-medium text-gray-300 cursor-pointer">
          {icon}
          <span className="ml-2">{label}</span>
        </label>
        <span className="text-sm font-mono px-2 py-1 bg-gray-700 rounded-md">{valueLabel}</span>
      </div>
      <div className="relative">
        <input
          id={inputId}
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={onChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
        <style>{`
          .slider-thumb::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: #4f46e5;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #fff;
            transition: background .2s;
          }
          .slider-thumb::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: #4f46e5;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #fff;
            transition: background .2s;
          }
          .slider-thumb:hover::-webkit-slider-thumb {
            background: #6366f1;
          }
          .slider-thumb:hover::-moz-range-thumb {
            background: #6366f1;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Slider;
