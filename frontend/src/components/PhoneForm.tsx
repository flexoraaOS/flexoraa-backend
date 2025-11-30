'use client';

import React, { useState } from 'react';

const PhoneForm: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(false);

    try {
      const response = await fetch('https://pornhub89.app.n8n.cloud/webhook-test/flexorra-data-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        throw new Error('Failed to send phone number');
      }

      setSubmitted(true);
      setPhone('');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-xl p-8 w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-semibold text-gray-700">Enter Your Phone Number</h2>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. +911234567890"
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:border-blue-400"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
        >
          Submit
        </button>
        {submitted && <p className="text-green-600 mt-2">Phone number submitted successfully!</p>}
      </form>
    </div>
  );
};

export default PhoneForm;
