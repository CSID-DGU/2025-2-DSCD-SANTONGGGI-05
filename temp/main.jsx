import React, { useState, useEffect } from 'react';

// 1. 3개의 탭(자식) 컴포넌트들을 import 합니다.
import Tab1Category from './Tab1Category.jsx';
import Tab2Platform from './Tab2Platform.jsx';
import Tab3Pattern from './Tab3Pattern.jsx';

// 2. 불러올 데이터 파일의 경로
// (React public 폴더에 JSON 파일이 있어야함
const DATA_FILE_URL = './Purchase_ToyDataset.json';

/**
 * 이 App 컴포넌트는 다음 3가지 역할을 수행합니다.
 * 1. 데이터 로딩 (fetch)
 * 2. 로딩/에러 상태 관리
 * 3. 로딩이 완료되면 3개의 탭 컴포넌트에 데이터를 전달(prop)하여 렌더링
 */
export default function App() {
  
  // --- 상태 관리 ---
  // 1. allData: 로드된 JSON 데이터가 저장될 곳
  const [allData, setAllData] = useState(null);
  // 2. loading: 데이터 로딩 중인지 여부
  const [loading, setLoading] = useState(true);
  // 3. error: 데이터 로딩 중 에러가 발생했는지 여부
  const [error, setError] = useState(null);

  // --- 데이터 로딩 (Effect) ---
  // useEffect(..., [])는 컴포넌트가 처음 렌더링될 때 딱 한 번만 실행됩니다.
  useEffect(() => {
    
    // 비동기 fetch 함수를 정의하고 즉시 호출합니다.
    async function loadData() {
      try {
        // public 폴더의 JSON 파일을 요청합니다.
        const response = await fetch(DATA_FILE_URL);
        
        // 응답이 실패하면 (예: 404 Not Found) 에러를 발생시킵니다.
        if (!response.ok) {
          throw new Error(`데이터 로딩 실패: ${response.status} ${response.statusText}`);
        }
        
        // 응답을 JSON으로 파싱합니다.
        const jsonData = await response.json();
        
        // 성공적으로 불러온 데이터를 allData state에 저장합니다.
        setAllData(jsonData);

      } catch (err) {
        // fetch 과정에서 발생한 에러를 error state에 저장합니다.
        console.error("데이터 로딩 중 에러 발생:", err);
        setError(err.message);
      } finally {
        // 성공하든 실패하든, 로딩 상태를 '끝'(false)으로 변경합니다.
        setLoading(false);
      }
    }

    loadData(); // 정의한 함수를 실행합니다.

  }, []); // [] : 의존성 배열이 비어있으므로, 이 effect는 한 번만 실행됩니다.

  
  // --- 렌더링 로직 ---

  // 1. 아직 로딩 중일 때 표시할 UI
  if (loading) {
    return <div>데이터를 불러오는 중입니다...</div>;
  }

  // 2. 에러가 발생했을 때 표시할 UI
  if (error) {
    return <div>에러가 발생했습니다: {error}</div>;
  }

  // 3. 로딩이 성공적으로 완료되었을 때
  // (allData에 JSON 데이터가 들어있음)
  return (
    <div>
      <h1>대시보드</h1>
      
      {/* 각 탭 컴포넌트에 로드된 'allData'를 'data'라는 이름의 prop으로 전달합니다.
        이제 3개의 탭은 데이터를 받아 그래프를 구성할 수 있습니다.
      */}
      
      <hr />
      <h2>구매 카테고리 분석</h2>
      <Tab1Category data={allData} />
      
      <hr />
      <h2>구매 플랫폼 분석</h2>
      <Tab2Platform data={allData} />
      
      <hr />
      <h2>소비 패턴 분석</h2>
      <Tab3Pattern data={allData} />
    </div>
  );
}