import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './AppV2';
import './style.css';
import './v2.css';
const BenchPreview=React.lazy(()=>import('./BenchPreview'));
const BodhiPreview=React.lazy(()=>import('./BodhiPreview'));
const CushionPreview=React.lazy(()=>import('./CushionPreview'));
const BowPreview=React.lazy(()=>import('./BowPreview'));
const preview=new URLSearchParams(location.search).get('view');
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>{preview==='ghe-da'||preview==='bo-de'||preview==='san-chua'||preview==='bo-doan'||preview==='lay-phat'?<React.Suspense fallback={null}>{preview==='lay-phat'?<BowPreview/>:preview==='bo-doan'?<CushionPreview/>:preview==='ghe-da'?<BenchPreview/>:<BodhiPreview/>}</React.Suspense>:<App/>}</React.StrictMode>);


import './v3.css';
import './rituals.css';

import './mobile.css';

import './water-task.css';
