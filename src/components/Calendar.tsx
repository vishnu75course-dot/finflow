
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  highlightDates?: Date[];
  reminderDates?: Date[];
}

export const Calendar = ({ onDateSelect, highlightDates = [], reminderDates = [] }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  // Fill in empty days for the first week
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-10 w-full" />);
  }

  // Fill in the actual days
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    const isToday = new Date().toDateString() === date.toDateString();
    const isHighlighted = highlightDates.some(h => h.toDateString() === date.toDateString());
    const isReminder = reminderDates.some(h => h.toDateString() === date.toDateString());

    days.push(
      <button
        key={d}
        onClick={() => onDateSelect?.(date)}
        className={`h-10 w-full rounded-xl flex items-center justify-center text-xs font-bold transition-all relative group cursor-pointer
          ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'hover:bg-slate-50 text-slate-700'}
          ${isReminder && !isToday ? 'border-2 border-amber-400 text-amber-700' : ''}
        `}
      >
        <span>{d}</span>
        {isHighlighted && !isToday && !isReminder && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />
        )}
        {isReminder && !isToday && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full" />
        )}
      </button>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">
            {monthNames[month]} {year}
          </h4>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={prevMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={nextMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="h-8 flex items-center justify-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {day}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>

      <div className="mt-6 flex items-center gap-4 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-indigo-600 rounded-full" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activity Detected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reminder</span>
        </div>
      </div>
    </div>
  );
};
