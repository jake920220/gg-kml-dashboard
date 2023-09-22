'use client';

import React, {useEffect} from "react";
import Image from 'next/image'
import axios from "axios";

export default function Home() {
  const fetchData = async () => {
    try {
      const response = await axios.get('/api/crawlMonthly'); // API 엔드포인트 경로
      console.log(response.data); // API에서 반환한 데이터를 처리
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <button onClick={fetchData}>click this button</button>
    </main>
  )
}
