import React from 'react';
import { Card } from './UI';

export const StatBox = ({ title, value, subtext, colorBg, colorText, icon, extraContent, size="normal" }: any) => (
    <Card className={colorBg + " border-l-4 " + colorText.replace("text", "border") + " relative overflow-hidden h-full flex flex-col justify-between stat-card dark:bg-gray-800 dark:border-opacity-70"}>
      <div className="flex justify-between items-start z-10 relative">
          <div className="w-full">
              <p className={`text-gray-600 dark:text-gray-300 font-medium uppercase tracking-wide truncate pr-2 ${size === "small" ? "text-[10px]" : "text-xs"}`}>{title}</p>
              <h3 className={`font-bold mt-1 truncate ${colorText} ${size === "small" ? "text-xl" : "text-2xl"}`}>{value}</h3>
              {subtext && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">{subtext}</p>}
              {extraContent}
          </div>
          {icon && <div className={`p-2 rounded-full bg-white/70 dark:bg-gray-700/50 shadow-sm shrink-0 ${size === "small" ? "scale-75 origin-top-right" : ""}`}>{icon}</div>}
      </div>
    </Card>
);