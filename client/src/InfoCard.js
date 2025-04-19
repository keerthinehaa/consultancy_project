// src/components/InfoCard.js
import React from 'react';

function InfoCard({ title, description, icon }) {
  return (
    <div className="bg-white shadow-md rounded-xl p-4 flex items-start gap-4">
      <div className="text-blue-600 text-3xl">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}

export default InfoCard;
