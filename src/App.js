import { useState, useEffect, useRef, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// ─── RESPONSIVE HOOK ─────────────────────────────────────────────────────────
const useWindowSize = () => {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return size;
};

// 레이아웃 브레이크포인트
// lg ≥1200  : 사이드바 풀(232px) + 레이블
// md 768~1199: 사이드바 미니(68px) + 아이콘만
// sm <768    : 사이드바 숨김 + 오버레이(햄버거)
const useLayout = () => {
  const { w } = useWindowSize();
  const isLg  = w >= 1200;
  const isMd  = w >= 768 && w < 1200;
  const isSm  = w < 768;
  const sidebarW = isLg ? 232 : isMd ? 68 : 0;
  const collapsed = isMd; // 아이콘만
  const mobile    = isSm;
  // 콘텐츠 패딩: 화면 너비에 비례
  const contentPx = isLg ? 32 : isMd ? 20 : 14;
  const contentPy = isLg ? 26 : 18;
  return { sidebarW, collapsed, mobile, contentPx, contentPy, w };
};

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const C = {
  blue: "#1B64DA", blueSoft: "#EBF2FF", blueHover: "#1550B8",
  green: "#0BB77C", greenSoft: "#E6F9F2",
  red: "#F03B3B", redSoft: "#FEF0F0",
  orange: "#F5812A", orangeSoft: "#FEF4EB",
  purple: "#7B5CF0", purpleSoft: "#F2EFFE",
  bg: "#F6F8FB", white: "#FFFFFF",
  border: "#E3E8F0", borderLight: "#F0F4F9",
  text: "#1A2236", textSub: "#5E6F8A", textMuted: "#97A3B6",
  sidebar: "#0F1B2D", sidebarHover: "#1B2D45", sidebarActive: "#1B64DA",
};
const T = { xs:"11px", sm:"12px", base:"13px", md:"14px", lg:"16px", xl:"18px", "2xl":"22px", "3xl":"28px" };

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const HQ_LIST = [
  { id:1, name:"브릿지커피",  plan:"Special",    stores:10, activeUsers:47,  status:"완료",  am:"김민준", mrr:300000,  contractEnd:"2025-12-31", aiCalls:1200, aiTokenCost:12000, industry:"카페" },
  { id:2, name:"한솥도시락", plan:"Enterprise", stores:24, activeUsers:118, status:"완료",  am:"이수진", mrr:1200000, contractEnd:"2026-03-31", aiCalls:2880, aiTokenCost:28800, industry:"도시락" },
  { id:3, name:"미가미가",   plan:"Basic",      stores:6,  activeUsers:19,  status:"진행중",am:"박도현", mrr:90000,   contractEnd:"2025-09-30", aiCalls:0,    aiTokenCost:0,     industry:"분식" },
  { id:4, name:"롤링파스타", plan:"Special",    stores:15, activeUsers:72,  status:"완료",  am:"최예린", mrr:450000,  contractEnd:"2026-01-31", aiCalls:1800, aiTokenCost:18000, industry:"파스타" },
  { id:5, name:"빽다방",     plan:"Basic",      stores:8,  activeUsers:31,  status:"완료",  am:"정태영", mrr:120000,  contractEnd:"2025-11-30", aiCalls:0,    aiTokenCost:0,     industry:"카페" },
];
const MRR_TREND = [
  {month:"9월",mrr:1710000},{month:"10월",mrr:1830000},{month:"11월",mrr:1950000},
  {month:"12월",mrr:2040000},{month:"1월",mrr:2100000},{month:"2월",mrr:2160000},
];
const AI_MONTHLY = [
  {month:"9월",calls:4200,cost:42000},{month:"10월",calls:5100,cost:51000},
  {month:"11월",calls:5800,cost:58000},{month:"12월",calls:6100,cost:61000},
  {month:"1월",calls:6500,cost:65000},{month:"2월",calls:5880,cost:58800},
];
const INVOICES = [
  {id:"INV-2502-001",hq:"한솥도시락",amount:1200000,status:"납부완료",date:"2025-02-01"},
  {id:"INV-2502-002",hq:"롤링파스타",amount:450000,status:"납부완료",date:"2025-02-01"},
  {id:"INV-2502-003",hq:"브릿지커피",amount:300000,status:"납부완료",date:"2025-02-01"},
  {id:"INV-2502-004",hq:"빽다방",amount:120000,status:"미납",date:"2025-02-01"},
  {id:"INV-2502-005",hq:"미가미가",amount:90000,status:"납부완료",date:"2025-02-01"},
];
const SYSTEM_STATUS = [
  {name:"API 서버",status:"정상",responseTime:"142ms",uptime:"99.97%",errorRate:"0.03%"},
  {name:"AI 코칭 서버",status:"정상",responseTime:"380ms",uptime:"99.91%",errorRate:"0.09%"},
  {name:"POS 연동",status:"정상",responseTime:"95ms",uptime:"99.99%",errorRate:"0.01%"},
  {name:"배달 앱 연동",status:"경고",responseTime:"1,240ms",uptime:"98.70%",errorRate:"1.30%"},
  {name:"VAN 결제 연동",status:"정상",responseTime:"210ms",uptime:"99.95%",errorRate:"0.05%"},
  {name:"데이터베이스",status:"정상",responseTime:"22ms",uptime:"100%",errorRate:"0.00%"},
];
const NOTICES = [
  {id:1,title:"v2.3.0 업데이트 안내 - AI 코칭 개선",target:"전체",date:"2025-02-10",status:"배포완료"},
  {id:2,title:"2월 정기 점검 공지 (2/15 02:00~04:00)",target:"전체",date:"2025-02-08",status:"배포완료"},
  {id:3,title:"한솥도시락 Enterprise 전용 기능 안내",target:"한솥도시락",date:"2025-02-05",status:"배포완료"},
  {id:4,title:"v2.4.0 릴리즈 예정 안내",target:"전체",date:"2025-02-14",status:"예약"},
];
const ACCOUNTS = [
  {id:1,name:"김민준",email:"minjun@bridgecode.kr",role:"운영팀",team:"CS",status:"활성",lastLogin:"2025-02-14 09:12"},
  {id:2,name:"이수진",email:"sujin@bridgecode.kr",role:"운영팀",team:"AM",status:"활성",lastLogin:"2025-02-14 08:47"},
  {id:3,name:"박도현",email:"dohyun@bridgecode.kr",role:"운영팀",team:"AM",status:"활성",lastLogin:"2025-02-13 17:30"},
  {id:4,name:"최예린",email:"yerin@bridgecode.kr",role:"세일즈팀",team:"Sales",status:"활성",lastLogin:"2025-02-14 10:05"},
  {id:5,name:"정태영",email:"taeyoung@bridgecode.kr",role:"기술팀",team:"DevOps",status:"활성",lastLogin:"2025-02-14 07:55"},
  {id:6,name:"윤서연",email:"seoyeon@bridgecode.kr",role:"기술팀",team:"Backend",status:"비활성",lastLogin:"2025-01-30 14:22"},
];

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const Icon = ({ name, size=18, color="currentColor" }) => {
  const p = (d, extra={}) => <path d={d} stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" {...extra}/>;
  const icons = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.5" fill="none"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.5" fill="none"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.5" fill="none"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.5" fill="none"/></>,
    building: <>{p("M3 21V7a1 1 0 011-1h16a1 1 0 011 1v14")}{p("M3 21h18")}{p("M9 21v-5h6v5")}<rect x="8" y="10" width="2.5" height="2.5" rx=".5" fill={color}/><rect x="13.5" y="10" width="2.5" height="2.5" rx=".5" fill={color}/><rect x="8" y="14" width="2.5" height="2.5" rx=".5" fill={color}/><rect x="13.5" y="14" width="2.5" height="2.5" rx=".5" fill={color}/></>,
    creditcard: <><rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.6" fill="none"/>{p("M2 10h20")}{p("M6 15h4",{strokeWidth:"1.8"})}</>,
    cpu: <><rect x="7" y="7" width="10" height="10" rx="1" stroke={color} strokeWidth="1.5" fill="none"/>{p("M9 5V3M12 5V3M15 5V3M9 21v-2M12 21v-2M15 21v-2M5 9H3M5 12H3M5 15H3M21 9h-2M21 12h-2M21 15h-2",{strokeWidth:"1.5"})}</>,
    monitor: <><rect x="2" y="3" width="20" height="14" rx="2" stroke={color} strokeWidth="1.6" fill="none"/>{p("M8 21h8M12 17v4")}</>,
    bell: <>{p("M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9")}{p("M13.73 21a2 2 0 01-3.46 0")}</>,
    users: <>{p("M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2")}<circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.6" fill="none"/>{p("M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75")}</>,
    settings: <>{p("M12 15a3 3 0 100-6 3 3 0 000 6z",{fill:"none"})}{p("M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z")}</>,
    chevronRight: <>{p("M9 18l6-6-6-6",{strokeWidth:"1.8"})}</>,
    chevronLeft: <>{p("M15 18l-6-6 6-6",{strokeWidth:"1.8"})}</>,
    edit: <>{p("M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7")}{p("M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z")}</>,
    trending: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke={color} strokeWidth="1.6" fill="none"/><polyline points="17 6 23 6 23 12" stroke={color} strokeWidth="1.6" fill="none"/></>,
    alert: <>{p("M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z")}<line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="1.6" strokeLinecap="round"/><circle cx="12" cy="17" r="0.8" fill={color}/></>,
    check: <polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    search: <><circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.6" fill="none"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth="1.6" strokeLinecap="round"/></>,
    logout: <>{p("M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4")}<polyline points="16 17 21 12 16 7" stroke={color} strokeWidth="1.6" fill="none"/><line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth="1.6"/></>,
    dollar: <><line x1="12" y1="1" x2="12" y2="23" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>{p("M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6")}</>,
    eye: <>{p("M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z")}<circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.6" fill="none"/></>,
    refresh: <><polyline points="23 4 23 10 17 10" stroke={color} strokeWidth="1.6" fill="none"/>{p("M20.49 15a9 9 0 11-2.12-9.36L23 10")}</>,
    grid: <><rect x="3" y="3" width="7" height="7" stroke={color} strokeWidth="1.5" fill="none"/><rect x="14" y="3" width="7" height="7" stroke={color} strokeWidth="1.5" fill="none"/><rect x="14" y="14" width="7" height="7" stroke={color} strokeWidth="1.5" fill="none"/><rect x="3" y="14" width="7" height="7" stroke={color} strokeWidth="1.5" fill="none"/></>,
    download: <><polyline points="8 17 12 21 16 17" stroke={color} strokeWidth="1.6" fill="none"/><line x1="12" y1="12" x2="12" y2="21" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>{p("M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29")}</>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none">{icons[name] || null}</svg>;
};

// ─── UTILITIES ────────────────────────────────────────────────────────────────
const fmt = (n) => n?.toLocaleString("ko-KR");
const planColor = (p) => p==="Enterprise"?C.purple:p==="Special"?C.blue:C.textSub;
const planBg = (p) => p==="Enterprise"?C.purpleSoft:p==="Special"?C.blueSoft:C.borderLight;

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const Badge = ({label,color,bg}) => (
  <span style={{display:"inline-flex",alignItems:"center",padding:"2px 9px",borderRadius:99,fontSize:T.sm,fontWeight:600,color,background:bg,whiteSpace:"nowrap"}}>{label}</span>
);
const PlanBadge = ({plan}) => <Badge label={plan} color={planColor(plan)} bg={planBg(plan)} />;
const StatusDot = ({status}) => {
  const ok  = ["정상","완료","납부완료","활성","배포완료"].includes(status);
  const warn= ["경고","진행중","예약","점검중"].includes(status);
  const bad = ["미납","비활성","오류"].includes(status);
  return <Badge label={status} color={ok?C.green:warn?C.orange:bad?C.red:C.textMuted} bg={ok?C.greenSoft:warn?C.orangeSoft:bad?C.redSoft:C.borderLight} />;
};

const Card = ({children,style={}}) => (
  <div style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,padding:"20px 24px",...style}}>{children}</div>
);

const KPICard = ({label,value,sub,icon,color=C.blue,trend,trendBad}) => (
  <Card style={{flex:1,minWidth:"180px"}}>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
      <div style={{minWidth:0}}>
        <div style={{fontSize:T.sm,color:C.textSub,fontWeight:500,marginBottom:7}}>{label}</div>
        <div style={{fontSize:T["3xl"],fontWeight:800,color:C.text,letterSpacing:"-0.5px",lineHeight:1.1}}>{value}</div>
        {sub&&<div style={{fontSize:T.sm,color:C.textMuted,marginTop:5}}>{sub}</div>}
        {trend&&<div style={{display:"flex",alignItems:"center",gap:4,marginTop:6}}>
          <Icon name="trending" size={12} color={trendBad?C.red:C.green}/>
          <span style={{fontSize:T.xs,color:trendBad?C.red:C.green,fontWeight:600}}>{trend}</span>
        </div>}
      </div>
      <div style={{width:42,height:42,borderRadius:10,background:color+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:12}}>
        <Icon name={icon} size={20} color={color}/>
      </div>
    </div>
  </Card>
);

const SectionHeader = ({title,sub,action}) => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
    <div>
      <div style={{fontSize:T.xl,fontWeight:800,color:C.text,letterSpacing:"-0.3px"}}>{title}</div>
      {sub&&<div style={{fontSize:T.sm,color:C.textSub,marginTop:3}}>{sub}</div>}
    </div>
    {action}
  </div>
);

const Table = ({cols,rows,renderRow}) => (
  <div style={{overflowX:"auto"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:T.md}}>
      <thead>
        <tr style={{borderBottom:`1.5px solid ${C.border}`}}>
          {cols.map((c,i)=><th key={i} style={{padding:"10px 16px",textAlign:"left",fontSize:T.sm,fontWeight:600,color:C.textSub,whiteSpace:"nowrap"}}>{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row,i)=>(
          <tr key={i} style={{borderBottom:`1px solid ${C.borderLight}`}}
            onMouseEnter={e=>e.currentTarget.style.background=C.bg}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >{renderRow(row,i)}</tr>
        ))}
      </tbody>
    </table>
  </div>
);
const Td = ({children,style={}}) => <td style={{padding:"13px 16px",color:C.text,verticalAlign:"middle",...style}}>{children}</td>;

const BtnPrimary = ({children,onClick,style={}}) => (
  <button onClick={onClick} style={{padding:"8px 16px",borderRadius:8,background:C.blue,color:C.white,border:"none",fontSize:T.sm,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,...style}}
    onMouseEnter={e=>e.currentTarget.style.background=C.blueHover}
    onMouseLeave={e=>e.currentTarget.style.background=C.blue}
  >{children}</button>
);
const BtnGhost = ({children,onClick,style={}}) => (
  <button onClick={onClick} style={{padding:"7px 14px",borderRadius:8,background:C.white,color:C.textSub,border:`1px solid ${C.border}`,fontSize:T.sm,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:6,...style}}
    onMouseEnter={e=>{e.currentTarget.style.background=C.bg;e.currentTarget.style.color=C.text;}}
    onMouseLeave={e=>{e.currentTarget.style.background=C.white;e.currentTarget.style.color=C.textSub;}}
  >{children}</button>
);

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
const Dashboard = () => {
  const totalStores = HQ_LIST.reduce((s,h)=>s+h.stores,0);
  const totalUsers  = HQ_LIST.reduce((s,h)=>s+h.activeUsers,0);
  const totalMRR    = HQ_LIST.reduce((s,h)=>s+h.mrr,0);
  return (
    <div>
      <SectionHeader title="대시보드" sub="Selviser 플랫폼 전체 현황"/>
      <div style={{display:"flex",gap:14,marginBottom:18,flexWrap:"wrap"}}>
        <KPICard label="총 가입 본사" value={`${HQ_LIST.length}개`} sub={`가맹점 ${totalStores}개 운영 중`} icon="building" color={C.blue} trend="+2 이번달"/>
        <KPICard label="활성 유저 수" value={`${fmt(totalUsers)}명`} sub="매니저·직원 합계" icon="users" color={C.green} trend="+18 이번달"/>
        <KPICard label="이번달 MRR" value={`₩${fmt(totalMRR)}`} sub="플랫폼 월 반복 매출" icon="creditcard" color={C.purple} trend="+2.4% MoM"/>
        <KPICard label="구독 고객사" value={`${HQ_LIST.length}개`} sub="E·1개 S·2개 B·2개" icon="dollar" color={C.orange}/>
      </div>

      <Card style={{marginBottom:18}}>
        <div style={{fontSize:T.md,fontWeight:700,color:C.text,marginBottom:14}}>월별 MRR 추이</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={MRR_TREND} margin={{top:4,right:4,bottom:0,left:0}}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="10%" stopColor={C.blue} stopOpacity={0.15}/>
                <stop offset="90%" stopColor={C.blue} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight}/>
            <XAxis dataKey="month" tick={{fontSize:11,fill:C.textSub}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:11,fill:C.textSub}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/10000).toFixed(0)}만`}/>
            <Tooltip formatter={v=>[`₩${fmt(v)}`,"MRR"]} contentStyle={{fontSize:12,borderRadius:8,border:`1px solid ${C.border}`}}/>
            <Area type="monotone" dataKey="mrr" stroke={C.blue} strokeWidth={2.5} fill="url(#g1)" dot={{fill:C.blue,r:3,strokeWidth:0}}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div style={{fontSize:T.md,fontWeight:700,color:C.text,marginBottom:14}}>고객사 현황 요약</div>
        <Table
          cols={["본사명","플랜","가맹점","활성유저","이번달 MRR","온보딩","담당 AM"]}
          rows={HQ_LIST}
          renderRow={row=><>
            <Td><span style={{fontWeight:700}}>{row.name}</span></Td>
            <Td><PlanBadge plan={row.plan}/></Td>
            <Td style={{color:C.textSub}}>{row.stores}개</Td>
            <Td style={{color:C.textSub}}>{row.activeUsers}명</Td>
            <Td style={{fontWeight:700}}>₩{fmt(row.mrr)}</Td>
            <Td><StatusDot status={row.status}/></Td>
            <Td style={{color:C.textSub}}>{row.am}</Td>
          </>}
        />
      </Card>
    </div>
  );
};


// ─── HQ MANAGEMENT (프로세스 1·2 완전 구현) ──────────────────────────────────

// ── 공통 배지 ─────────────────────────────────────────────────────────────────
const TenantBadge = ({status}) => {
  const m = {ACTIVE:{l:"ACTIVE",c:C.green,b:C.greenSoft},PENDING:{l:"PENDING",c:C.orange,b:C.orangeSoft},SUSPENDED:{l:"SUSPENDED",c:C.red,b:C.redSoft},TERMINATED:{l:"TERMINATED",c:C.textMuted,b:C.borderLight}};
  const s = m[status]||{l:status,c:C.textMuted,b:C.borderLight};
  return <Badge label={s.l} color={s.c} bg={s.b}/>;
};
const OnboardBadge = ({status}) => {
  const m = {COMPLETED:{l:"완료",c:C.green,b:C.greenSoft},INVITED:{l:"초대발송",c:C.blue,b:C.blueSoft},PENDING:{l:"대기중",c:C.orange,b:C.orangeSoft}};
  const s = m[status]||{l:status,c:C.textMuted,b:C.borderLight};
  return <Badge label={s.l} color={s.c} bg={s.b}/>;
};
const InviteBadge = ({status}) => {
  const m = {SENT:{l:"발송완료",c:C.blue,b:C.blueSoft},EXPIRED:{l:"만료",c:C.red,b:C.redSoft},ACCEPTED:{l:"수락완료",c:C.green,b:C.greenSoft},INVITED:{l:"초대중",c:C.orange,b:C.orangeSoft}};
  const s = m[status]||{l:status,c:C.textMuted,b:C.borderLight};
  return <Badge label={s.l} color={s.c} bg={s.b}/>;
};
const UserStatusBadge = ({status}) => {
  const m = {ACTIVE:{l:"ACTIVE",c:C.green,b:C.greenSoft},INVITED:{l:"INVITED",c:C.blue,b:C.blueSoft},LOCKED:{l:"LOCKED",c:C.red,b:C.redSoft},DISABLED:{l:"DISABLED",c:C.textMuted,b:C.borderLight}};
  const s = m[status]||{l:status,c:C.textMuted,b:C.borderLight};
  return <Badge label={s.l} color={s.c} bg={s.b}/>;
};

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({msg,type="success"}) => (
  <div style={{position:"fixed",top:22,right:26,zIndex:9999,background:type==="error"?C.red:type==="warn"?C.orange:C.text,color:"#fff",padding:"11px 20px",borderRadius:10,fontSize:T.sm,fontWeight:600,boxShadow:"0 4px 20px rgba(0,0,0,0.22)",display:"flex",alignItems:"center",gap:8,maxWidth:360}}>
    <Icon name={type==="error"?"alert":type==="warn"?"alert":"check"} size={15} color="#fff"/>
    {msg}
  </div>
);

// ── 임시 비밀번호 1회 노출 모달 ───────────────────────────────────────────────
const TempPasswordModal = ({email, password, onClose}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{background:C.white,borderRadius:16,width:460,padding:"32px 32px",boxShadow:"0 24px 64px rgba(0,0,0,0.22)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
        <div style={{width:40,height:40,borderRadius:10,background:C.greenSoft,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon name="check" size={20} color={C.green}/>
        </div>
        <div>
          <div style={{fontSize:T.lg,fontWeight:800,color:C.text}}>마스터 초대 발송 완료</div>
          <div style={{fontSize:T.xs,color:C.textSub,marginTop:2}}>초대 링크 TTL: 72시간</div>
        </div>
      </div>
      <div style={{background:C.bg,borderRadius:10,padding:"16px 18px",marginBottom:14}}>
        <div style={{fontSize:T.xs,color:C.textMuted,marginBottom:6,fontWeight:500}}>초대 이메일</div>
        <div style={{fontSize:T.md,fontWeight:600,color:C.blue}}>{email}</div>
      </div>
      <div style={{background:"#FFF8E6",border:`1.5px solid ${C.orange}44`,borderRadius:10,padding:"16px 18px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
          <Icon name="alert" size={14} color={C.orange}/>
          <span style={{fontSize:T.xs,fontWeight:700,color:C.orange}}>임시 비밀번호 — 1회만 표시됩니다</span>
        </div>
        <div style={{fontFamily:"monospace",fontSize:"22px",fontWeight:800,color:C.text,letterSpacing:"4px",padding:"12px 16px",background:C.white,borderRadius:8,border:`1px solid ${C.border}`,textAlign:"center"}}>{password}</div>
        <div style={{fontSize:T.xs,color:C.textSub,marginTop:8}}>이 창을 닫으면 다시 확인할 수 없습니다. 마스터에게 안전하게 전달하세요.</div>
      </div>
      <div style={{padding:"11px 14px",background:C.blueSoft,borderRadius:9,border:`1px solid ${C.blue}22`,marginBottom:18,fontSize:T.xs,color:C.blue,lineHeight:1.7}}>
        <b>로그인 정책 안내 (BC Admin · FR Admin 공통)</b><br/>
        · 최초 로그인 시 이메일 인증(OTP) 후 비밀번호 변경이 필수입니다.<br/>
        · 변경 전까지 서비스 이용이 제한됩니다.
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <BtnGhost onClick={onClose}>복사 완료, 닫기</BtnGhost>
        <BtnPrimary onClick={onClose}>확인</BtnPrimary>
      </div>
    </div>
  </div>
);

// ── 마스터 초대 모달 ──────────────────────────────────────────────────────────
const MasterInviteModal = ({hqName, onClose, onSend}) => {
  const [email, setEmail] = useState("");
  const handleSend = () => {
    if (!email) return;
    onSend(email, TEMP_PASSWORD);
    onClose();
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C.white,borderRadius:14,width:440,padding:"28px",boxShadow:"0 20px 60px rgba(0,0,0,0.18)"}}>
        <div style={{fontSize:T.xl,fontWeight:800,color:C.text,marginBottom:4}}>마스터 계정 초대</div>
        <div style={{fontSize:T.xs,color:C.textSub,marginBottom:20}}>POST /api/v1/admin/accounts/master/invite · {hqName}</div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:T.xs,fontWeight:600,color:C.textSub,marginBottom:5}}>마스터 이메일 주소 *</div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="master@example.com"
            style={{width:"100%",padding:"10px 14px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:T.md,outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{padding:"12px 14px",background:C.blueSoft,borderRadius:9,marginBottom:20,fontSize:T.xs,color:C.blue,lineHeight:1.7}}>
          ※ 임시 비밀번호가 이메일과 함께 발송되며, 화면에 1회만 표시됩니다.<br/>
          ※ 최초 로그인 시 비밀번호 변경이 필수입니다.<br/>
          ※ 초대 링크 유효기간: 72시간
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <BtnGhost onClick={onClose}>취소</BtnGhost>
          <BtnPrimary onClick={handleSend} style={{background:email?C.blue:C.textMuted,cursor:email?"pointer":"not-allowed"}}>초대 발송</BtnPrimary>
        </div>
      </div>
    </div>
  );
};

// ── HQ 신규 등록 모달 (프로세스 1-1) ─────────────────────────────────────────
const HQRegisterModal = ({onClose, onComplete}) => {
  const [form, setForm] = useState({name:"",bizNo:"",ceo:"",contractRefNo:"",plan:"Basic",contractConfirmed:false});
  const [step, setStep] = useState(1); // 1: 입력, 2: 완료
  const isValid = form.name && form.bizNo && form.ceo && form.contractConfirmed;

  const handleSubmit = () => {
    if (!isValid) return;
    setStep(2);
  };

  if (step === 2) return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C.white,borderRadius:14,width:440,padding:"32px",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.18)"}}>
        <div style={{width:56,height:56,borderRadius:14,background:C.orangeSoft,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <Icon name="building" size={26} color={C.orange}/>
        </div>
        <div style={{fontSize:T.xl,fontWeight:800,color:C.text,marginBottom:8}}>HQ 등록 완료</div>
        <div style={{fontSize:T.sm,color:C.textSub,marginBottom:20}}>
          <b style={{color:C.text}}>{form.name}</b>이 플랫폼에 등록되었습니다.<br/>
          TenantStatus: <b style={{color:C.orange}}>PENDING</b> · HQOnboardingStatus: <b style={{color:C.orange}}>PENDING</b>
        </div>
        <div style={{background:C.bg,borderRadius:10,padding:"14px 16px",textAlign:"left",marginBottom:20}}>
          {[["상호명",form.name],["사업자등록번호",form.bizNo],["대표자",form.ceo],["구독 플랜",form.plan],["계약번호",form.contractRefNo||"미입력"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${C.borderLight}`,fontSize:T.sm}}>
              <span style={{color:C.textSub}}>{k}</span><span style={{fontWeight:600,color:C.text}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{padding:"10px 14px",background:C.orangeSoft,borderRadius:9,fontSize:T.xs,color:C.orange,marginBottom:20}}>
          다음 단계: 계정 관리 탭에서 마스터 계정 초대를 진행하세요.
        </div>
        <BtnPrimary onClick={()=>{onComplete(form);onClose();}} style={{width:"100%",justifyContent:"center"}}>완료</BtnPrimary>
      </div>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C.white,borderRadius:14,width:520,maxHeight:"88vh",overflowY:"auto",padding:"28px",boxShadow:"0 20px 60px rgba(0,0,0,0.18)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
          <div>
            <div style={{fontSize:T.xl,fontWeight:800,color:C.text}}>HQ 신규 등록</div>
            <div style={{fontSize:T.xs,color:C.textSub,marginTop:3,fontFamily:"monospace"}}>POST /api/v1/admin/franchises</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:20,padding:0,lineHeight:1}}>✕</button>
        </div>
        {/* 상태 안내 */}
        <div style={{display:"flex",gap:8,marginBottom:20,padding:"12px 16px",background:C.bg,borderRadius:10,alignItems:"center"}}>
          {[["PENDING","등록 직후"],["INVITED","마스터 초대"],["COMPLETED","마스터 수락"]].map(([s,l],i,arr)=>(
            <div key={s} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{padding:"3px 10px",borderRadius:6,background:i===0?C.orange+"20":C.borderLight,border:`1px solid ${i===0?C.orange:C.border}`,fontSize:T.xs,fontWeight:700,color:i===0?C.orange:C.textMuted}}>{s}</div>
              {i<arr.length-1 && <Icon name="chevronRight" size={12} color={C.textMuted}/>}
            </div>
          ))}
          <span style={{fontSize:T.xs,color:C.textMuted,marginLeft:"auto"}}>현재 단계</span>
        </div>
        {/* 입력 필드 */}
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:18}}>
          {[
            ["상호명 *","text","예: 브릿지커피","name"],
            ["사업자등록번호 *","text","123-45-67890","bizNo"],
            ["대표자명 *","text","홍길동","ceo"],
            ["계약서 참조번호","text","CONT-2025-XXX","contractRefNo"],
          ].map(([label,type,ph,key])=>(
            <div key={key}>
              <div style={{fontSize:T.xs,fontWeight:600,color:C.textSub,marginBottom:5}}>{label}</div>
              <input type={type} placeholder={ph} value={form[key]}
                onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}
                style={{width:"100%",padding:"10px 14px",border:`1px solid ${form[key]?C.blue+"66":C.border}`,borderRadius:8,fontSize:T.md,outline:"none",boxSizing:"border-box",transition:"border-color .2s"}}/>
            </div>
          ))}
          <div>
            <div style={{fontSize:T.xs,fontWeight:600,color:C.textSub,marginBottom:5}}>구독 플랜 *</div>
            <select value={form.plan} onChange={e=>setForm(p=>({...p,plan:e.target.value}))}
              style={{width:"100%",padding:"10px 14px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:T.md,outline:"none",color:C.text}}>
              <option value="Basic">Basic — ₩15,000/가맹점·월</option>
              <option value="Special">Special — ₩30,000/가맹점·월</option>
              <option value="Enterprise">Enterprise — 별도 계약</option>
            </select>
          </div>
        </div>
        {/* 계약 확인 체크박스 */}
        <div onClick={()=>setForm(p=>({...p,contractConfirmed:!p.contractConfirmed}))}
          style={{display:"flex",alignItems:"flex-start",gap:10,padding:"14px 16px",background:form.contractConfirmed?C.greenSoft:C.bg,border:`1.5px solid ${form.contractConfirmed?C.green:C.border}`,borderRadius:10,cursor:"pointer",marginBottom:20,transition:"all .2s"}}>
          <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${form.contractConfirmed?C.green:C.border}`,background:form.contractConfirmed?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
            {form.contractConfirmed && <Icon name="check" size={11} color="#fff"/>}
          </div>
          <div style={{fontSize:T.sm,color:form.contractConfirmed?C.green:C.textSub,fontWeight:form.contractConfirmed?600:400}}>
            계약 내용을 확인하였으며, 해당 프랜차이즈 본사의 플랫폼 등록을 승인합니다. *
          </div>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <BtnGhost onClick={onClose}>취소</BtnGhost>
          <BtnPrimary onClick={handleSubmit}
            style={{background:isValid?C.blue:C.textMuted,cursor:isValid?"pointer":"not-allowed"}}>
            <Icon name="plus" size={14} color="#fff"/>등록 완료
          </BtnPrimary>
        </div>
      </div>
    </div>
  );
};

// ── HQ 상세: 기본정보 탭 ──────────────────────────────────────────────────────
const HQTabInfo = ({hq, onStatusChange}) => {
  const [confirmAction, setConfirmAction] = useState(null);
  const isSuspended = hq.tenantStatus === "SUSPENDED";
  const isTerminated = hq.tenantStatus === "TERMINATED";
  return (
    <div>
      <div style={{display:"flex",gap:14}}>
        <Card style={{flex:2}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:T.md,fontWeight:700,color:C.text}}>기본 정보</div>
            {!isTerminated && (
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setConfirmAction(isSuspended?"ACTIVE":"SUSPENDED")}
                  style={{padding:"5px 14px",borderRadius:7,border:`1px solid ${isSuspended?C.green+"66":C.red+"66"}`,background:isSuspended?C.greenSoft:C.redSoft,color:isSuspended?C.green:C.red,fontSize:T.xs,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,transition:"all .2s"}}>
                  <Icon name={isSuspended?"check":"alert"} size={12} color={isSuspended?C.green:C.red}/>
                  {isSuspended?"서비스 재개":"서비스 중지"}
                </button>
                <button onClick={()=>setConfirmAction("TERMINATED")}
                  style={{padding:"5px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",color:C.textMuted,fontSize:T.xs,fontWeight:600,cursor:"pointer"}}>
                  계약 종료
                </button>
              </div>
            )}
          </div>
          {confirmAction && (
            <div style={{background:confirmAction==="TERMINATED"||confirmAction==="SUSPENDED"?C.redSoft:C.greenSoft,border:`1px solid ${confirmAction==="ACTIVE"?C.green:C.red}33`,borderRadius:9,padding:"13px 16px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div>
                <div style={{fontSize:T.sm,fontWeight:700,color:confirmAction==="ACTIVE"?C.green:C.red,marginBottom:3}}>
                  {confirmAction==="SUSPENDED"?"서비스를 중지하시겠습니까?"
                  :confirmAction==="ACTIVE"?"서비스를 재개하시겠습니까?"
                  :"계약을 종료하시겠습니까? 이 작업은 되돌릴 수 없습니다."}
                </div>
                <div style={{fontSize:T.xs,color:C.textSub}}>
                  TenantStatus → <b style={{fontFamily:"monospace"}}>{confirmAction}</b>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <button onClick={()=>{onStatusChange(confirmAction);setConfirmAction(null);}}
                  style={{padding:"6px 14px",borderRadius:6,border:"none",background:confirmAction==="ACTIVE"?C.green:C.red,color:"#fff",fontSize:T.xs,fontWeight:700,cursor:"pointer"}}>확인</button>
                <button onClick={()=>setConfirmAction(null)}
                  style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${C.border}`,background:C.white,color:C.textSub,fontSize:T.xs,cursor:"pointer"}}>취소</button>
              </div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              ["Franchise ID",hq.franchiseId],["사업자등록번호",hq.bizNo],
              ["상호명",hq.name],["대표자명",hq.ceo],
              ["계약서 참조번호",hq.contractRefNo],["업종",hq.industry],
              ["구독 플랜","__plan"],["TenantStatus","__tenant"],
              ["HQOnboardingStatus","__onboard"],["담당 AM",hq.am],
              ["계약 만료일",hq.contractEnd],["등록일",hq.createdAt],
            ].map(([k,v])=>(
              <div key={k} style={{padding:"10px 13px",background:C.bg,borderRadius:8}}>
                <div style={{fontSize:T.xs,color:C.textMuted,marginBottom:4,fontWeight:500}}>{k}</div>
                <div style={{fontSize:T.md,fontWeight:600,color:C.text}}>
                  {v==="__plan"?<PlanBadge plan={hq.plan}/>
                  :v==="__tenant"?<TenantBadge status={hq.tenantStatus}/>
                  :v==="__onboard"?<OnboardBadge status={hq.hqOnboarding}/>
                  :v||"—"}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:12}}>
          <Card>
            <div style={{fontSize:T.sm,fontWeight:700,color:C.text,marginBottom:12}}>가맹점 현황</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["전체 매장",hq.stores,C.blue],["활성",Math.round(hq.stores*0.85),C.green],["점검중",1,C.orange],["비활성",Math.max(0,hq.stores-Math.round(hq.stores*0.85)-1),C.textMuted]].map(([l,v,c])=>(
                <div key={l} style={{padding:"10px 12px",background:C.bg,borderRadius:8,textAlign:"center"}}>
                  <div style={{fontSize:T.xs,color:C.textMuted,marginBottom:3}}>{l}</div>
                  <div style={{fontSize:T.xl,fontWeight:800,color:c}}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div style={{fontSize:T.sm,fontWeight:700,color:C.text,marginBottom:10}}>수익 현황</div>
            {[["구독 MRR",`₩${fmt(hq.mrr)}`,C.blue],["활성 유저",`${hq.activeUsers}명`,C.green]].map(([l,v,c])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:C.bg,borderRadius:8,marginBottom:7}}>
                <span style={{fontSize:T.sm,color:C.textSub}}>{l}</span>
                <span style={{fontSize:T.md,fontWeight:800,color:c}}>{v}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
};

// ── HQ 상세: 매장 목록 탭 ─────────────────────────────────────────────────────
const HQTabStores = ({hq}) => {
  const [filter, setFilter] = useState("전체");
  const stores = Array.from({length:hq.stores},(_,i)=>({
    storeId:`ST-${String(hq.id).padStart(3,"0")}-${String(i+1).padStart(3,"0")}`,
    name:`${hq.name} ${["강남","홍대","신촌","이태원","건대","잠실","명동","종로","판교","수원","인천","부산","대구","광주","대전","울산"][i%16]}점`,
    region:["서울","서울","경기","서울","서울","서울","서울","서울","경기","경기","인천","부산","대구","광주","대전","울산"][i%16],
    manager:["김철수","이영희","박민수","최지은","정호준"][i%5],
    grade:["SV","일반","가맹","일반","일반"][i%5],
    status:i===2?"비활성":i===4?"점검중":"활성",
    createdAt:`2024-${String((i%11)+1).padStart(2,"0")}-${String((i*3%28)+1).padStart(2,"0")}`,
  }));
  const filtered = filter==="전체"?stores:stores.filter(s=>s.status===filter);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{display:"flex",gap:6}}>
          {["전체","활성","비활성","점검중"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${f===filter?C.blue:C.border}`,background:f===filter?C.blue:C.white,color:f===filter?C.white:C.textSub,fontSize:T.xs,fontWeight:f===filter?700:500,cursor:"pointer"}}>
              {f} ({f==="전체"?stores.length:stores.filter(s=>s.status===f).length})
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <BtnGhost style={{padding:"5px 12px",fontSize:T.xs}}>
            <Icon name="download" size={13} color={C.textSub}/>엑셀 다운로드
          </BtnGhost>
        </div>
      </div>
      <Card>
        <Table cols={["매장 ID","매장명","지역","등급","담당 매니저","직원","상태","등록일"]} rows={filtered}
          renderRow={row=><>
            <Td><span style={{fontFamily:"monospace",fontSize:T.xs,color:C.blue,fontWeight:600}}>{row.storeId}</span></Td>
            <Td style={{fontWeight:600}}>{row.name}</Td>
            <Td style={{color:C.textSub,fontSize:T.xs}}>{row.region}</Td>
            <Td><Badge label={row.grade} color={row.grade==="SV"?C.purple:C.textSub} bg={row.grade==="SV"?C.purpleSoft:C.borderLight}/></Td>
            <Td style={{fontSize:T.sm}}>{row.manager}</Td>
            <Td style={{color:C.textSub,fontSize:T.xs}}>—</Td>
            <Td><StatusDot status={row.status}/></Td>
            <Td style={{color:C.textMuted,fontSize:T.xs}}>{row.createdAt}</Td>
          </>}
        />
      </Card>
    </div>
  );
};

// ── HQ 상세: 계정 관리 탭 (프로세스 1-2 마스터 초대) ─────────────────────────
const HQTabAccounts = ({hq}) => {
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState("success");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTempPw, setShowTempPw] = useState(null); // {email, password}
  const [accounts, setAccounts] = useState([
    {userId:`USR-${hq.id}01`,name:"김본사",email:`master@${hq.name}.co.kr`,role:"HQ_MASTER",userStatus:"ACTIVE",inviteStatus:"ACCEPTED",lastLogin:"2025-02-14 09:12",isMaster:true},
    {userId:`USR-${hq.id}02`,name:"이매니저",email:`mgr1@${hq.name}.co.kr`,role:"HQ_MANAGER",userStatus:"ACTIVE",inviteStatus:"ACCEPTED",lastLogin:"2025-02-13 14:30",isMaster:false},
    {userId:`USR-${hq.id}03`,name:"박직원",email:`staff1@${hq.name}.co.kr`,role:"STORE_STAFF",userStatus:"LOCKED",inviteStatus:"ACCEPTED",lastLogin:"2025-02-10 10:05",isMaster:false},
    {userId:`USR-${hq.id}04`,name:"—",email:`invited@${hq.name}.co.kr`,role:"HQ_MANAGER",userStatus:"INVITED",inviteStatus:"SENT",lastLogin:"—",isMaster:false},
    {userId:`USR-${hq.id}05`,name:"—",email:`expired@${hq.name}.co.kr`,role:"HQ_MANAGER",userStatus:"INVITED",inviteStatus:"EXPIRED",lastLogin:"—",isMaster:false},
  ]);

  const showMsg = (msg, type="success") => { setToast(msg); setToastType(type); setTimeout(()=>setToast(null),3000); };

  const handleMasterInvite = (email, pw) => {
    setShowTempPw({email, pw});
    showMsg("마스터 초대 발송 완료 — 임시 비밀번호를 확인하세요.", "success");
  };

  const handleUnlock = (userId) => {
    setAccounts(prev=>prev.map(a=>a.userId===userId?{...a,userStatus:"ACTIVE"}:a));
    showMsg("계정 잠금이 해제되었습니다. (UserStatus → ACTIVE)", "success");
  };

  const handleResend = (userId) => {
    setAccounts(prev=>prev.map(a=>a.userId===userId?{...a,inviteStatus:"SENT"}:a));
    showMsg("초대 메일이 재발송되었습니다. 기존 토큰 폐기 처리.", "success");
  };

  const handleDisable = (userId) => {
    setAccounts(prev=>prev.map(a=>a.userId===userId?{...a,userStatus:"DISABLED"}:a));
    showMsg("계정이 비활성화되었습니다.", "warn");
  };

  const roleLabel = r=>({HQ_MASTER:"마스터",HQ_MANAGER:"HQ 매니저",STORE_STAFF:"매장 직원"}[r]||r);
  const roleColor = r=>r==="HQ_MASTER"?C.purple:r==="HQ_MANAGER"?C.blue:C.textSub;
  const roleBg    = r=>r==="HQ_MASTER"?C.purpleSoft:r==="HQ_MANAGER"?C.blueSoft:C.borderLight;

  return (
    <div>
      {toast && <Toast msg={toast} type={toastType}/>}
      {showInviteModal && <MasterInviteModal hqName={hq.name} onClose={()=>setShowInviteModal(false)} onSend={handleMasterInvite}/>}
      {showTempPw && <TempPasswordModal email={showTempPw.email} password={showTempPw.pw} onClose={()=>setShowTempPw(null)}/>}

      {/* 마스터 계정 섹션 */}
      <Card style={{marginBottom:14,border:`1px solid ${C.purple}33`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <div style={{fontSize:T.sm,fontWeight:700,color:C.purple}}>마스터 계정 (BC-ACCT-002)</div>
            <div style={{fontSize:T.xs,color:C.textSub,marginTop:2}}>POST /api/v1/admin/accounts/master/invite</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <BtnGhost style={{padding:"5px 12px",fontSize:T.xs}} onClick={()=>handleResend(`USR-${hq.id}01`)}>
              <Icon name="refresh" size={12} color={C.textSub}/>초대 재발송
            </BtnGhost>
            <button onClick={()=>setShowInviteModal(true)}
              style={{padding:"6px 14px",borderRadius:8,border:"none",background:C.purple,color:"#fff",fontSize:T.xs,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              <Icon name="plus" size={13} color="#fff"/>마스터 초대
            </button>
          </div>
        </div>
        {accounts.filter(a=>a.isMaster).map(a=>(
          <div key={a.userId} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",background:C.bg,borderRadius:10,border:`1px solid ${C.border}`}}>
            <div style={{width:38,height:38,borderRadius:10,background:C.purple,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Icon name="users" size={18} color="#fff"/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:T.sm,fontWeight:700,color:C.text}}>{a.name}</div>
              <div style={{fontSize:T.xs,color:C.textSub,marginTop:1}}>{a.email}</div>
            </div>
            <UserStatusBadge status={a.userStatus}/>
            <InviteBadge status={a.inviteStatus}/>
            <button onClick={()=>handleDisable(a.userId)}
              style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${C.red}44`,background:C.redSoft,color:C.red,fontSize:T.xs,fontWeight:600,cursor:"pointer"}}>
              비활성화
            </button>
          </div>
        ))}
      </Card>

      {/* 전체 계정 목록 */}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <div style={{fontSize:T.sm,fontWeight:700,color:C.text}}>전체 계정 목록 (BC-ACCT-001)</div>
            <div style={{fontSize:T.xs,color:C.textSub,marginTop:2}}>GET /api/v1/admin/accounts?franchiseId={hq.franchiseId}</div>
          </div>
        </div>
        <Table cols={["유저 ID","이름","이메일","역할","UserStatus","InviteStatus","마지막 로그인","액션"]} rows={accounts}
          renderRow={row=><>
            <Td><span style={{fontFamily:"monospace",fontSize:T.xs,color:C.blue,fontWeight:600}}>{row.userId}</span></Td>
            <Td style={{fontWeight:600}}>{row.name}</Td>
            <Td style={{color:C.textSub,fontSize:T.xs}}>{row.email}</Td>
            <Td><Badge label={roleLabel(row.role)} color={roleColor(row.role)} bg={roleBg(row.role)}/></Td>
            <Td><UserStatusBadge status={row.userStatus}/></Td>
            <Td><InviteBadge status={row.inviteStatus}/></Td>
            <Td style={{color:C.textMuted,fontSize:T.xs}}>{row.lastLogin}</Td>
            <Td>
              <div style={{display:"flex",gap:5}}>
                {row.userStatus==="LOCKED" &&
                  <button onClick={()=>handleUnlock(row.userId)}
                    style={{padding:"3px 9px",borderRadius:6,border:`1px solid ${C.orange}44`,background:C.orangeSoft,color:C.orange,fontSize:T.xs,fontWeight:600,cursor:"pointer"}}>잠금해제</button>}
                {row.inviteStatus==="EXPIRED" &&
                  <button onClick={()=>handleResend(row.userId)}
                    style={{padding:"3px 9px",borderRadius:6,border:`1px solid ${C.blue}44`,background:C.blueSoft,color:C.blue,fontSize:T.xs,fontWeight:600,cursor:"pointer"}}>재발송</button>}
                {row.inviteStatus==="SENT" &&
                  <button onClick={()=>handleResend(row.userId)}
                    style={{padding:"3px 9px",borderRadius:6,border:`1px solid ${C.border}`,background:C.bg,color:C.textSub,fontSize:T.xs,cursor:"pointer"}}>재발송</button>}
                {row.userStatus==="ACTIVE" && !row.isMaster &&
                  <button onClick={()=>handleDisable(row.userId)}
                    style={{padding:"3px 9px",borderRadius:6,border:`1px solid ${C.border}`,background:C.bg,color:C.textSub,fontSize:T.xs,cursor:"pointer"}}>비활성</button>}
              </div>
            </Td>
          </>}
        />
      </Card>
    </div>
  );
};

// ── HQ 상세: 변경 이력 탭 ─────────────────────────────────────────────────────
const HQTabAudit = ({hq}) => {
  const logs = [
    {logId:"LOG-0241",actor:"이수진 (AM)",actionType:"STATUS_CHANGE",changeData:'{"from":"PENDING","to":"ACTIVE"}',createdAt:"2025-01-15 10:22"},
    {logId:"LOG-0218",actor:"이수진 (AM)",actionType:"ONBOARDING_COMPLETE",changeData:'{"hqOnboarding":"COMPLETED"}',createdAt:"2025-01-14 16:05"},
    {logId:"LOG-0190",actor:"시스템",actionType:"MASTER_INVITE_SENT",changeData:`{"email":"master@${hq.name}.co.kr","inviteStatus":"SENT"}`,createdAt:"2025-01-10 11:30"},
    {logId:"LOG-0155",actor:"김민준 (AM)",actionType:"PLAN_CHANGE",changeData:`{"from":"Basic","to":"${hq.plan}"}`,createdAt:"2024-12-03 14:11"},
    {logId:"LOG-0051",actor:"박도현 (AM)",actionType:"HQ_CREATED",changeData:'{"tenantStatus":"PENDING","hqOnboarding":"PENDING"}',createdAt:"2024-09-01 11:00"},
  ];
  const typeColor = t=>({STATUS_CHANGE:C.orange,ONBOARDING_COMPLETE:C.green,MASTER_INVITE_SENT:C.blue,PLAN_CHANGE:C.purple,HQ_CREATED:C.blue}[t]||C.textMuted);
  return (
    <Card>
      <div style={{fontSize:T.sm,fontWeight:700,color:C.text,marginBottom:14}}>변경 이력 · AuditLog (BC-FR-002)</div>
      <Table cols={["Log ID","처리자","ActionType","변경 데이터","일시"]} rows={logs}
        renderRow={row=><>
          <Td><span style={{fontFamily:"monospace",fontSize:T.xs,color:C.blue}}>{row.logId}</span></Td>
          <Td style={{fontSize:T.sm}}>{row.actor}</Td>
          <Td><Badge label={row.actionType} color={typeColor(row.actionType)} bg={typeColor(row.actionType)+"18"}/></Td>
          <Td><code style={{fontSize:T.xs,color:C.textSub,background:C.bg,padding:"3px 7px",borderRadius:5}}>{row.changeData}</code></Td>
          <Td style={{color:C.textMuted,fontSize:T.xs}}>{row.createdAt}</Td>
        </>}
      />
    </Card>
  );
};

// ── HQ 상세 컨테이너 ─────────────────────────────────────────────────────────
const HQDetail = ({hq: initHq, onBack}) => {
  const [tab, setTab] = useState("info");
  const [hq, setHq] = useState(initHq);
  const TABS = [{k:"info",l:"기본 정보"},{k:"stores",l:`매장 목록 (${hq.stores})`},{k:"accounts",l:"계정 관리"},{k:"audit",l:"변경 이력"}];
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",color:C.textSub,fontSize:T.sm,padding:0,fontWeight:500}}>
          <Icon name="chevronLeft" size={15} color={C.textSub}/>고객사 목록
        </button>
        <Icon name="chevronRight" size={12} color={C.textMuted}/>
        <span style={{fontSize:T.sm,color:C.text,fontWeight:700}}>{hq.name}</span>
      </div>
      {/* 상단 헤더 */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,padding:"16px 20px",background:C.white,borderRadius:12,border:`1px solid ${C.border}`}}>
        <div style={{width:44,height:44,borderRadius:11,background:C.blueSoft,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Icon name="building" size={22} color={C.blue}/>
        </div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
            <span style={{fontSize:T.xl,fontWeight:800,color:C.text}}>{hq.name}</span>
            <TenantBadge status={hq.tenantStatus}/>
            <PlanBadge plan={hq.plan}/>
            <OnboardBadge status={hq.hqOnboarding}/>
          </div>
          <div style={{fontSize:T.xs,color:C.textSub}}>
            <span style={{fontFamily:"monospace",color:C.blue,fontWeight:600}}>{hq.franchiseId}</span>
            <span style={{margin:"0 8px"}}>·</span>담당 AM: <b style={{color:C.text}}>{hq.am}</b>
            <span style={{margin:"0 8px"}}>·</span>가맹점 {hq.stores}개
            <span style={{margin:"0 8px"}}>·</span>활성유저 {hq.activeUsers}명
          </div>
        </div>
      </div>
      {/* 탭 */}
      <div style={{display:"flex",gap:0,borderBottom:`2px solid ${C.border}`,marginBottom:18}}>
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)}
            style={{padding:"9px 20px",border:"none",background:"none",cursor:"pointer",fontSize:T.sm,fontWeight:tab===t.k?700:500,color:tab===t.k?C.blue:C.textSub,borderBottom:tab===t.k?`2px solid ${C.blue}`:"2px solid transparent",marginBottom:"-2px",transition:"all .15s"}}>
            {t.l}
          </button>
        ))}
      </div>
      {tab==="info"     && <HQTabInfo hq={hq} onStatusChange={s=>setHq(p=>({...p,tenantStatus:s}))}/>}
      {tab==="stores"   && <HQTabStores hq={hq}/>}
      {tab==="accounts" && <HQTabAccounts hq={hq}/>}
      {tab==="audit"    && <HQTabAudit hq={hq}/>}
    </div>
  );
};

// ── 가입 신청 상세 모달 (프로세스 2) ─────────────────────────────────────────
const ApplicationDetail = ({app, onClose, onApprove, onReject}) => {
  const [rejectReason, setRejectReason] = useState("");
  const [confirmType, setConfirmType] = useState(null);
  const [rejectError, setRejectError] = useState(false);

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) { setRejectError(true); return; }
    onReject(app.appId, rejectReason);
    onClose();
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C.white,borderRadius:16,width:580,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 64px rgba(0,0,0,0.2)"}}>
        {/* 헤더 */}
        <div style={{padding:"24px 28px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:T.xl,fontWeight:800,color:C.text,marginBottom:4}}>신청 상세</div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{fontFamily:"monospace",fontSize:T.xs,color:C.blue,fontWeight:600}}>{app.appId}</span>
              <AppStatusBadge status={app.status}/>
              {app.missingDocs && <Badge label="서류 누락" color={C.red} bg={C.redSoft}/>}
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:20,padding:0}}>✕</button>
        </div>
        <div style={{padding:"20px 28px"}}>
          {/* 신청 정보 */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
            {[["신청 상호",app.hqName],["대표자명",app.ceo],["사업자등록번호",app.bizNo],["접수일",app.receivedAt],["담당자",app.assigneeName||"미배정"],["신청 플랜",app.plan]].map(([k,v])=>(
              <div key={k} style={{padding:"10px 13px",background:C.bg,borderRadius:8}}>
                <div style={{fontSize:T.xs,color:C.textMuted,marginBottom:3}}>{k}</div>
                <div style={{fontSize:T.md,fontWeight:600,color:C.text}}>{v||"—"}</div>
              </div>
            ))}
          </div>
          {/* 서류 목록 */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:T.sm,fontWeight:700,color:C.text,marginBottom:10}}>제출 서류</div>
            {[
              {doc:"사업자등록증",status:true},
              {doc:"계약서 스캔본",status:!app.missingDocs},
              {doc:"대표자 신분증",status:true},
            ].map(d=>(
              <div key={d.doc} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 13px",background:C.bg,borderRadius:8,marginBottom:6}}>
                <span style={{fontSize:T.sm,color:C.text}}>{d.doc}</span>
                {d.status
                  ?<Badge label="제출완료" color={C.green} bg={C.greenSoft}/>
                  :<Badge label="누락" color={C.red} bg={C.redSoft}/>}
              </div>
            ))}
          </div>
          {/* 중복 신청 경고 */}
          {app.isDuplicate && (
            <div style={{background:C.orangeSoft,border:`1px solid ${C.orange}44`,borderRadius:9,padding:"11px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
              <Icon name="alert" size={15} color={C.orange}/>
              <span style={{fontSize:T.xs,color:C.orange,fontWeight:600}}>동일 사업자번호({app.bizNo})의 기존 신청이 존재합니다. 기존 신청을 확인하세요.</span>
            </div>
          )}
          {/* 반려 사유 입력 */}
          {confirmType==="reject" && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:T.sm,fontWeight:700,color:C.text,marginBottom:8}}>반려 사유 <span style={{color:C.red}}>*</span></div>
              <textarea rows={3} value={rejectReason} onChange={e=>{setRejectReason(e.target.value);setRejectError(false);}}
                placeholder="반려 사유를 입력하세요 (필수)"
                style={{width:"100%",padding:"10px 14px",border:`1.5px solid ${rejectError?C.red:C.border}`,borderRadius:8,fontSize:T.sm,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
              {rejectError && <div style={{fontSize:T.xs,color:C.red,marginTop:4}}>반려 사유를 입력해야 합니다.</div>}
            </div>
          )}
          {/* 액션 버튼 */}
          {app.status==="PENDING" && (
            <div style={{display:"flex",gap:8,justifyContent:"flex-end",paddingTop:8,borderTop:`1px solid ${C.borderLight}`}}>
              {confirmType===null && <>
                <BtnGhost onClick={onClose}>닫기</BtnGhost>
                <button onClick={()=>setConfirmType("reject")}
                  style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${C.red}44`,background:C.redSoft,color:C.red,fontSize:T.sm,fontWeight:600,cursor:"pointer"}}>
                  반려
                </button>
                <BtnPrimary onClick={()=>setConfirmType("approve")} style={{background:app.missingDocs?C.textMuted:C.blue,cursor:app.missingDocs?"not-allowed":"pointer"}}>
                  <Icon name="check" size={14} color="#fff"/>승인
                </BtnPrimary>
              </>}
              {confirmType==="approve" && <>
                <div style={{flex:1,fontSize:T.sm,color:C.text,display:"flex",alignItems:"center"}}>
                  <Icon name="alert" size={14} color={C.orange}/>&nbsp;승인 시 HQ가 자동 생성됩니다. (TenantStatus=PENDING)
                </div>
                <BtnGhost onClick={()=>setConfirmType(null)}>취소</BtnGhost>
                <BtnPrimary onClick={()=>{onApprove(app.appId);onClose();}}>최종 승인</BtnPrimary>
              </>}
              {confirmType==="reject" && <>
                <BtnGhost onClick={()=>{setConfirmType(null);setRejectReason("");}}>취소</BtnGhost>
                <button onClick={handleRejectSubmit}
                  style={{padding:"8px 18px",borderRadius:8,border:"none",background:C.red,color:"#fff",fontSize:T.sm,fontWeight:600,cursor:"pointer"}}>반려 확정</button>
              </>}
            </div>
          )}
          {app.status!=="PENDING" && (
            <div style={{display:"flex",justifyContent:"flex-end"}}><BtnGhost onClick={onClose}>닫기</BtnGhost></div>
          )}
        </div>
      </div>
    </div>
  );
};

const AppStatusBadge = ({status}) => {
  const m = {PENDING:{l:"승인 대기",c:C.orange,b:C.orangeSoft},APPROVED:{l:"승인완료",c:C.green,b:C.greenSoft},REJECTED:{l:"반려",c:C.red,b:C.redSoft},REVIEWING:{l:"검토중",c:C.blue,b:C.blueSoft}};
  const s = m[status]||{l:status,c:C.textMuted,b:C.borderLight};
  return <Badge label={s.l} color={s.c} bg={s.b}/>;
};

// ── HQ 목록 메인 ─────────────────────────────────────────────────────────────
const HQManagement = () => {
  const [view, setView] = useState("list"); // list | detail | applications
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("전체");
  const [showRegister, setShowRegister] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);

  const showMsg = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const [hqList, setHqList] = useState(HQ_LIST.map((h,i)=>({
    ...h,
    tenantStatus: i===2?"PENDING":i===4?"SUSPENDED":"ACTIVE",
    hqOnboarding: i===2?"PENDING":"COMPLETED",
    franchiseId: `FR-${String(h.id).padStart(4,"0")}`,
    masterEmail: `master@${h.name.replace(/\s/g,"")}.co.kr`,
    ceo: ["홍길동","김대표","이사장","박대표","최원장"][i],
    bizNo: [`101-23-45678`,`202-34-56789`,`303-45-67890`,`404-56-78901`,`505-67-89012`][i],
    contractRefNo: [`CONT-2024-001`,`CONT-2024-002`,`CONT-2025-003`,`CONT-2024-004`,`CONT-2024-005`][i],
    createdAt: ["2024-01-15","2024-02-20","2025-01-08","2024-06-10","2024-09-01"][i],
  })));

  const [applications, setApplications] = useState([
    {appId:"APP-2502-001",hqName:"맛있는분식",ceo:"오민수",bizNo:"601-78-90123",plan:"Basic",status:"PENDING",assigneeName:"박도현",receivedAt:"2025-02-13",missingDocs:false,isDuplicate:false},
    {appId:"APP-2502-002",hqName:"스시아리가또",ceo:"김일본",bizNo:"702-89-01234",plan:"Special",status:"PENDING",assigneeName:"",receivedAt:"2025-02-12",missingDocs:true,isDuplicate:false},
    {appId:"APP-2502-003",hqName:"치킨공화국",ceo:"이치킨",bizNo:"303-45-67890",plan:"Basic",status:"REVIEWING",assigneeName:"박도현",receivedAt:"2025-02-10",missingDocs:false,isDuplicate:true},
    {appId:"APP-2501-004",hqName:"파스타나라",ceo:"최파스타",bizNo:"804-90-12345",plan:"Special",status:"APPROVED",assigneeName:"김민준",receivedAt:"2025-01-28",missingDocs:false,isDuplicate:false},
    {appId:"APP-2501-005",hqName:"버거왕국",ceo:"박버거",bizNo:"905-01-23456",plan:"Basic",status:"REJECTED",assigneeName:"이수진",receivedAt:"2025-01-20",missingDocs:false,isDuplicate:false},
  ]);

  const handleApprove = (appId) => {
    setApplications(prev=>prev.map(a=>a.appId===appId?{...a,status:"APPROVED"}:a));
    showMsg("승인 완료 — HQ가 PENDING 상태로 생성됩니다.", "success");
  };
  const handleReject = (appId, reason) => {
    setApplications(prev=>prev.map(a=>a.appId===appId?{...a,status:"REJECTED",rejectReason:reason}:a));
    showMsg(`반려 처리 완료 — 사유: "${reason.slice(0,20)}..."`, "warn");
  };

  const FILTERS = ["전체","ACTIVE","PENDING","SUSPENDED","TERMINATED"];
  const filtered = statusFilter==="전체"?hqList:hqList.filter(h=>h.tenantStatus===statusFilter);
  const pendingApps = applications.filter(a=>a.status==="PENDING").length;

  if (view==="detail") {
    const hq = hqList.find(h=>h.id===selectedId);
    return <HQDetail hq={hq} onBack={()=>setView("list")}/>;
  }

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      {showRegister && <HQRegisterModal onClose={()=>setShowRegister(false)} onComplete={(form)=>showMsg(`${form.name} 등록 완료 (PENDING)`, "success")}/>}
      {selectedApp && <ApplicationDetail app={selectedApp} onClose={()=>setSelectedApp(null)} onApprove={handleApprove} onReject={handleReject}/>}

      {/* 서브 탭 */}
      <div style={{display:"flex",gap:0,borderBottom:`2px solid ${C.border}`,marginBottom:20}}>
        {[{k:"list",l:"HQ 목록"},{k:"applications",l:`가입 신청 현황 ${pendingApps>0?`(${pendingApps})`:""}`,badge:pendingApps>0}].map(t=>(
          <button key={t.k} onClick={()=>setView(t.k)}
            style={{padding:"10px 22px",border:"none",background:"none",cursor:"pointer",fontSize:T.sm,fontWeight:view===t.k?700:500,color:view===t.k?C.blue:C.textSub,borderBottom:view===t.k?`2px solid ${C.blue}`:"2px solid transparent",marginBottom:"-2px",position:"relative",transition:"all .15s"}}>
            {t.l}
            {t.badge && <span style={{position:"absolute",top:6,right:4,width:8,height:8,borderRadius:"50%",background:C.red}}/>}
          </button>
        ))}
        <div style={{flex:1}}/>
        {view==="list" && (
          <div style={{display:"flex",gap:8,alignItems:"center",paddingBottom:4}}>
            <BtnPrimary onClick={()=>setShowRegister(true)}>
              <Icon name="plus" size={14} color="#fff"/>HQ 신규 등록
            </BtnPrimary>
          </div>
        )}
      </div>

      {/* HQ 목록 */}
      {view==="list" && (
        <div>
          <div style={{display:"flex",gap:7,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
            {FILTERS.map(f=>{
              const cnt = f==="전체"?hqList.length:hqList.filter(h=>h.tenantStatus===f).length;
              const active = statusFilter===f;
              const fc = f==="ACTIVE"?C.green:f==="PENDING"?C.orange:f==="SUSPENDED"||f==="TERMINATED"?C.red:C.blue;
              return (
                <button key={f} onClick={()=>setStatusFilter(f)}
                  style={{padding:"5px 14px",borderRadius:8,border:`1.5px solid ${active?(f==="전체"?C.blue:fc):C.border}`,background:active?(f==="전체"?C.blue:fc+"15"):C.white,color:active?(f==="전체"?C.white:fc):C.textSub,fontSize:T.sm,fontWeight:active?700:500,cursor:"pointer",transition:"all .15s"}}>
                  {f} <span style={{opacity:0.7,fontSize:T.xs}}>({cnt})</span>
                </button>
              );
            })}
            <div style={{flex:1}}/>
            <div style={{position:"relative",display:"flex",alignItems:"center"}}>
              <div style={{position:"absolute",left:10}}><Icon name="search" size={14} color={C.textMuted}/></div>
              <input placeholder="상호명·사업자번호 검색" style={{paddingLeft:32,paddingRight:12,height:34,border:`1px solid ${C.border}`,borderRadius:8,fontSize:T.sm,outline:"none",width:210}}/>
            </div>
          </div>
          <Card>
            <Table
              cols={["Franchise ID","상호명","TenantStatus","구독 플랜","가맹점","활성유저","HQOnboarding","담당 AM","계약 만료","액션"]}
              rows={filtered}
              renderRow={hq=><>
                <Td><span style={{fontFamily:"monospace",fontSize:T.xs,color:C.blue,fontWeight:700}}>{hq.franchiseId}</span></Td>
                <Td>
                  <div style={{fontWeight:700,color:C.text}}>{hq.name}</div>
                  <div style={{fontSize:T.xs,color:C.textMuted,marginTop:1}}>{hq.industry}</div>
                </Td>
                <Td><TenantBadge status={hq.tenantStatus}/></Td>
                <Td><PlanBadge plan={hq.plan}/></Td>
                <Td style={{color:C.textSub,fontSize:T.sm}}>{hq.stores}개</Td>
                <Td style={{color:C.textSub,fontSize:T.sm}}>{hq.activeUsers}명</Td>
                <Td><OnboardBadge status={hq.hqOnboarding}/></Td>
                <Td style={{color:C.textSub,fontSize:T.sm}}>{hq.am}</Td>
                <Td style={{color:C.textMuted,fontSize:T.xs}}>{hq.contractEnd}</Td>
                <Td>
                  <BtnGhost style={{padding:"4px 10px",fontSize:T.xs}} onClick={()=>{setSelectedId(hq.id);setView("detail");}}>
                    <Icon name="eye" size={12} color={C.textSub}/>상세
                  </BtnGhost>
                </Td>
              </>}
            />
          </Card>
        </div>
      )}

      {/* 가입 신청 현황 (프로세스 2) */}
      {view==="applications" && (
        <div>
          <div style={{display:"flex",gap:14,marginBottom:16,flexWrap:"wrap"}}>
            {[["승인 대기",applications.filter(a=>a.status==="PENDING").length,C.orange],["검토중",applications.filter(a=>a.status==="REVIEWING").length,C.blue],["이번달 접수",applications.filter(a=>a.receivedAt?.startsWith("2025-02")).length,C.purple]].map(([l,v,c])=>(
              <Card key={l} style={{flex:1,padding:"16px 20px"}}>
                <div style={{fontSize:T.sm,color:C.textSub,fontWeight:500,marginBottom:6}}>{l}</div>
                <div style={{fontSize:T["2xl"],fontWeight:800,color:c}}>{v}건</div>
              </Card>
            ))}
          </div>
          <div style={{display:"flex",gap:7,marginBottom:14,alignItems:"center"}}>
            {["전체","PENDING","REVIEWING","APPROVED","REJECTED"].map(f=>(
              <button key={f} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${f==="전체"?C.blue:C.border}`,background:f==="전체"?C.blue:C.white,color:f==="전체"?C.white:C.textSub,fontSize:T.xs,fontWeight:f==="전체"?700:500,cursor:"pointer"}}>
                {f} ({f==="전체"?applications.length:applications.filter(a=>a.status===f).length})
              </button>
            ))}
          </div>
          <Card>
            <Table
              cols={["신청 ID","상호명","대표자","사업자번호","플랜","상태","담당자","접수일","액션"]}
              rows={applications}
              renderRow={app=><>
                <Td><span style={{fontFamily:"monospace",fontSize:T.xs,color:C.blue,fontWeight:600}}>{app.appId}</span></Td>
                <Td>
                  <div style={{fontWeight:700}}>{app.hqName}</div>
                  <div style={{display:"flex",gap:4,marginTop:3}}>
                    {app.missingDocs && <Badge label="서류누락" color={C.red} bg={C.redSoft}/>}
                    {app.isDuplicate && <Badge label="중복신청" color={C.orange} bg={C.orangeSoft}/>}
                  </div>
                </Td>
                <Td style={{fontSize:T.sm}}>{app.ceo}</Td>
                <Td style={{fontFamily:"monospace",fontSize:T.xs,color:C.textSub}}>{app.bizNo}</Td>
                <Td><PlanBadge plan={app.plan}/></Td>
                <Td><AppStatusBadge status={app.status}/></Td>
                <Td style={{color:C.textSub,fontSize:T.sm}}>{app.assigneeName||<span style={{color:C.textMuted}}>미배정</span>}</Td>
                <Td style={{color:C.textMuted,fontSize:T.xs}}>{app.receivedAt}</Td>
                <Td>
                  <BtnGhost style={{padding:"4px 10px",fontSize:T.xs}} onClick={()=>setSelectedApp(app)}>
                    <Icon name="eye" size={12} color={C.textSub}/>검토
                  </BtnGhost>
                </Td>
              </>}
            />
          </Card>
        </div>
      )}
    </div>
  );
};

// ─── 구독·과금 관리 (프로세스 5 완전 구현) ──────────────────────────────────

// ── Mock 데이터 ───────────────────────────────────────────────────────────────
const RATE_PLANS = [
  {planId:"PLAN-HQ-001", planName:"프랜차이즈 본사 커스텀", price:30000000, billingCycle:"1회", target:"HQ", features:["전용 테넌트 환경","커스텀 도메인","전담 CS"], effectiveDate:"2024-01-01", visibility:"비공개"},
  {planId:"PLAN-ST-001", planName:"Basic",   price:15000, billingCycle:"월", target:"STORE", features:["POS 연동","재고관리","기본 리포트"], effectiveDate:"2024-01-01", visibility:"공개"},
  {planId:"PLAN-ST-002", planName:"Special", price:30000, billingCycle:"월", target:"STORE", features:["Basic 포함","AI 코칭","RAG 검색","자동 일정관리"], effectiveDate:"2024-01-01", visibility:"공개"},
];

const SUBSCRIPTIONS_DATA = [
  {subId:"SUB-001",tenantId:"FR-0001",tenantName:"브릿지커피",  storeId:null,storeName:null,planId:"PLAN-HQ-001",planName:"본사 커스텀",  amount:30000000,usageType:"PAID",status:"ACTIVE",    billingCycle:"1회",startDate:"2024-01-15",dueDate:"2024-01-29",paidAt:"2024-01-20",paymentMethod:"BANK_TRANSFER",cancelledDate:null},
  {subId:"SUB-002",tenantId:"FR-0002",tenantName:"한솥도시락", storeId:null,storeName:null,planId:"PLAN-HQ-001",planName:"본사 커스텀",  amount:30000000,usageType:"PAID",status:"ACTIVE",    billingCycle:"1회",startDate:"2024-02-20",dueDate:"2024-03-06",paidAt:"2024-02-25",paymentMethod:"BANK_TRANSFER",cancelledDate:null},
  {subId:"SUB-003",tenantId:"FR-0001",tenantName:"브릿지커피",  storeId:"ST-001-001",storeName:"브릿지커피 강남점",planId:"PLAN-ST-002",planName:"Special (AI 포함)",amount:30000,usageType:"PAID",status:"ACTIVE",billingCycle:"월",startDate:"2024-02-01",dueDate:"2025-03-15",paidAt:"2025-03-05",paymentMethod:"PG",cancelledDate:null},
  {subId:"SUB-004",tenantId:"FR-0001",tenantName:"브릿지커피",  storeId:"ST-001-002",storeName:"브릿지커피 홍대점",planId:"PLAN-ST-001",planName:"Basic (일반)",amount:15000,usageType:"FREE",status:"ACTIVE",billingCycle:"월",startDate:"2025-02-20",dueDate:"2025-03-06",paidAt:null,paymentMethod:null,cancelledDate:null,freeUntil:"2025-03-06"},
  {subId:"SUB-005",tenantId:"FR-0002",tenantName:"한솥도시락", storeId:"ST-002-001",storeName:"한솥 강남점",     planId:"PLAN-ST-001",planName:"Basic (일반)",amount:15000,usageType:"PAID",status:"SUSPENDED",billingCycle:"월",startDate:"2024-03-01",dueDate:"2025-03-15",paidAt:null,paymentMethod:null,cancelledDate:null},
  {subId:"SUB-006",tenantId:"FR-0004",tenantName:"롤링파스타", storeId:"ST-004-001",storeName:"롤링파스타 신촌점",planId:"PLAN-ST-002",planName:"Special (AI 포함)",amount:30000,usageType:"EVENT",status:"ACTIVE",billingCycle:"월",startDate:"2024-06-01",dueDate:"2025-04-01",paidAt:null,paymentMethod:null,cancelledDate:null,eventUntil:"2025-04-01",eventNote:"런칭 프로모션"},
  {subId:"SUB-007",tenantId:"FR-0005",tenantName:"빽다방",     storeId:"ST-005-001",storeName:"빽다방 건대점",   planId:"PLAN-ST-001",planName:"Basic (일반)",amount:15000,usageType:"PAID",status:"CANCELLED",billingCycle:"월",startDate:"2024-09-01",dueDate:"—",paidAt:null,paymentMethod:null,cancelledDate:"2025-01-31"},
];

const INVOICES_DATA = [
  {invoiceId:"INV-2502-001",tenantId:"FR-0002",tenantName:"한솥도시락",storeName:null,planName:"본사 커스텀",amount:30000000,issueDate:"2025-01-15",dueDate:"2025-01-29",paidAt:"2025-01-20",status:"PAID",paymentMethod:"BANK_TRANSFER",transactionId:"TXN-20250120-001"},
  {invoiceId:"INV-2502-002",tenantId:"FR-0004",tenantName:"롤링파스타",storeName:"롤링파스타 신촌점",planName:"Special (AI 포함)",amount:30000,issueDate:"2025-02-01",dueDate:"2025-02-15",paidAt:"2025-02-10",status:"PAID",paymentMethod:"PG",transactionId:"TXN-20250210-004"},
  {invoiceId:"INV-2502-003",tenantId:"FR-0001",tenantName:"브릿지커피",storeName:"브릿지커피 강남점",planName:"Special (AI 포함)",amount:30000,issueDate:"2025-02-01",dueDate:"2025-02-15",paidAt:"2025-02-08",status:"PAID",paymentMethod:"PG",transactionId:"TXN-20250208-002"},
  {invoiceId:"INV-2502-004",tenantId:"FR-0001",tenantName:"브릿지커피",storeName:"브릿지커피 홍대점",planName:"Basic (일반)",amount:15000,issueDate:"2025-02-01",dueDate:"2025-02-15",paidAt:null,status:"OVERDUE",paymentMethod:null,transactionId:null},
  {invoiceId:"INV-2502-005",tenantId:"FR-0005",tenantName:"빽다방",storeName:"빽다방 건대점",planName:"Basic (일반)",amount:15000,issueDate:"2025-02-01",dueDate:"2025-02-15",paidAt:null,status:"PENDING",paymentMethod:null,transactionId:null},
  {invoiceId:"INV-2502-006",tenantId:"FR-0002",tenantName:"한솥도시락",storeName:"한솥 강남점",planName:"Basic (일반)",amount:15000,issueDate:"2025-02-01",dueDate:"2025-02-15",paidAt:null,status:"OVERDUE",paymentMethod:null,transactionId:null},
  {invoiceId:"INV-2502-007",tenantId:"FR-0003",tenantName:"미가미가",storeName:null,planName:"본사 커스텀",amount:30000000,issueDate:"2025-01-08",dueDate:"2025-01-22",paidAt:"2025-01-18",status:"PAID",paymentMethod:"VIRTUAL_ACCOUNT",transactionId:"TXN-20250118-003"},
];

// ── ENUM 배지 ─────────────────────────────────────────────────────────────────
const InvoiceBadge = ({status}) => {
  const m = {PAID:{l:"납부완료",c:C.green,b:C.greenSoft},PENDING:{l:"미납",c:C.orange,b:C.orangeSoft},OVERDUE:{l:"연체",c:C.red,b:C.redSoft},CANCELLED:{l:"취소",c:C.textMuted,b:C.borderLight}};
  const s = m[status]||{l:status,c:C.textMuted,b:C.borderLight};
  return <Badge label={s.l} color={s.c} bg={s.b}/>;
};
const SubStatusBadge = ({status}) => {
  const m = {ACTIVE:{l:"ACTIVE",c:C.green,b:C.greenSoft},CANCELLED:{l:"CANCELLED",c:C.textMuted,b:C.borderLight},SUSPENDED:{l:"SUSPENDED",c:C.red,b:C.redSoft}};
  const s = m[status]||{l:status,c:C.textMuted,b:C.borderLight};
  return <Badge label={s.l} color={s.c} bg={s.b}/>;
};
const PayMethodBadge = ({method}) => {
  if (!method) return <span style={{color:C.textMuted,fontSize:T.xs}}>—</span>;
  const m = {PG:{l:"PG",c:C.blue,b:C.blueSoft},BANK_TRANSFER:{l:"계좌이체",c:C.purple,b:C.purpleSoft},VIRTUAL_ACCOUNT:{l:"가상계좌",c:C.green,b:C.greenSoft}};
  const s = m[method]||{l:method,c:C.textMuted,b:C.borderLight};
  return <Badge label={s.l} color={s.c} bg={s.b}/>;
};

// ── 납부 확인 모달 (PATCH /invoices/{id}/paid) ────────────────────────────────
const PaidConfirmModal = ({invoice, onClose, onConfirm}) => {
  const [form, setForm] = useState({paymentMethod:"PG", transactionId:"", paidAt: new Date().toISOString().split("T")[0]});
  const [error, setError] = useState("");
  const handleSubmit = () => {
    if (!form.transactionId.trim()) { setError("거래 ID를 입력하세요."); return; }
    onConfirm(invoice.invoiceId, form);
    onClose();
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C.white,borderRadius:14,width:460,padding:"28px",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <div style={{fontSize:T.xl,fontWeight:800,color:C.text,marginBottom:4}}>납부 확인 처리</div>
        <div style={{fontSize:T.xs,color:C.textSub,marginBottom:18,fontFamily:"monospace"}}>PATCH /api/v1/admin/invoices/{invoice.invoiceId}/paid</div>
        {/* 청구서 요약 */}
        <div style={{background:C.bg,borderRadius:10,padding:"14px 16px",marginBottom:16}}>
          {[["인보이스 ID",invoice.invoiceId],["고객사",invoice.tenantName+(invoice.storeName?` / ${invoice.storeName}`:"")],["청구 금액",`₩${fmt(invoice.amount)}`],["납기일",invoice.dueDate]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:T.sm}}>
              <span style={{color:C.textSub}}>{k}</span><span style={{fontWeight:600,color:C.text}}>{v}</span>
            </div>
          ))}
        </div>
        {/* 입력 */}
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:18}}>
          <div>
            <div style={{fontSize:T.xs,fontWeight:600,color:C.textSub,marginBottom:5}}>납부 방법 *</div>
            <select value={form.paymentMethod} onChange={e=>setForm(p=>({...p,paymentMethod:e.target.value}))}
              style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:T.sm,outline:"none",color:C.text}}>
              <option value="PG">PG (카드/간편결제)</option>
              <option value="BANK_TRANSFER">계좌이체</option>
              <option value="VIRTUAL_ACCOUNT">가상계좌</option>
            </select>
          </div>
          <div>
            <div style={{fontSize:T.xs,fontWeight:600,color:C.textSub,marginBottom:5}}>거래 ID *</div>
            <input value={form.transactionId} onChange={e=>{setForm(p=>({...p,transactionId:e.target.value}));setError("");}}
              placeholder="TXN-YYYYMMDD-XXX"
              style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${error?C.red:C.border}`,borderRadius:8,fontSize:T.sm,outline:"none",boxSizing:"border-box"}}/>
            {error && <div style={{fontSize:T.xs,color:C.red,marginTop:3}}>{error}</div>}
          </div>
          <div>
            <div style={{fontSize:T.xs,fontWeight:600,color:C.textSub,marginBottom:5}}>납부일 *</div>
            <input type="date" value={form.paidAt} onChange={e=>setForm(p=>({...p,paidAt:e.target.value}))}
              style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:T.sm,outline:"none",boxSizing:"border-box"}}/>
          </div>
        </div>
        <div style={{padding:"10px 14px",background:C.greenSoft,borderRadius:9,fontSize:T.xs,color:C.green,marginBottom:18,fontWeight:500}}>
          납부 확인 시 InvoiceStatus → PAID. OVERDUE였던 경우 TenantStatus/StoreStatus 자동 ACTIVE 복구.
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <BtnGhost onClick={onClose}>취소</BtnGhost>
          <BtnPrimary onClick={handleSubmit} style={{background:C.green}}>
            <Icon name="check" size={14} color="#fff"/>납부 확인
          </BtnPrimary>
        </div>
      </div>
    </div>
  );
};

// ── 요금제 변경 모달 (PUT /subscriptions/{id}/change-plan) ───────────────────
const ChangePlanModal = ({sub, onClose, onConfirm}) => {
  const storePlans = RATE_PLANS.filter(p=>p.target==="STORE");
  const [newPlanId, setNewPlanId] = useState(storePlans.find(p=>p.planId!==sub.planId)?.planId||"");
  const newPlan = RATE_PLANS.find(p=>p.planId===newPlanId);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C.white,borderRadius:14,width:460,padding:"28px",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <div style={{fontSize:T.xl,fontWeight:800,color:C.text,marginBottom:4}}>요금제 변경</div>
        <div style={{fontSize:T.xs,color:C.textSub,marginBottom:18,fontFamily:"monospace"}}>PUT /api/v1/admin/subscriptions/{sub.subId}/change-plan</div>
        <div style={{background:C.bg,borderRadius:9,padding:"12px 14px",marginBottom:16}}>
          <div style={{fontSize:T.xs,color:C.textMuted,marginBottom:3}}>현재 요금제</div>
          <div style={{fontWeight:700,color:C.text}}>{sub.planName} — ₩{fmt(sub.amount)}/월</div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:T.xs,fontWeight:600,color:C.textSub,marginBottom:8}}>변경할 요금제</div>
          {storePlans.filter(p=>p.planId!==sub.planId).map(p=>(
            <div key={p.planId} onClick={()=>setNewPlanId(p.planId)}
              style={{padding:"14px 16px",borderRadius:10,border:`2px solid ${newPlanId===p.planId?C.blue:C.border}`,background:newPlanId===p.planId?C.blueSoft:C.white,marginBottom:8,cursor:"pointer",transition:"all .15s"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontWeight:700,color:C.text}}>{p.planName}</span>
                <span style={{fontWeight:800,color:C.blue}}>₩{fmt(p.price)}/월 <span style={{fontSize:T.xs,color:C.textMuted}}>(VAT 별도)</span></span>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {p.features.map(f=><span key={f} style={{fontSize:T.xs,padding:"2px 7px",borderRadius:5,background:C.bg,color:C.textSub}}>{f}</span>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:"10px 14px",background:C.orangeSoft,borderRadius:9,fontSize:T.xs,color:C.orange,marginBottom:18}}>
          ※ 변경 신청월은 기존 요금제 유지. 차회 청구(다음 달 1일)부터 신규 요금제 적용.
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <BtnGhost onClick={onClose}>취소</BtnGhost>
          <BtnPrimary onClick={()=>{onConfirm(sub.subId, newPlanId, newPlan?.planName, newPlan?.price);onClose();}}>변경 신청</BtnPrimary>
        </div>
      </div>
    </div>
  );
};

// ── 구독 해지 확인 모달 ────────────────────────────────────────────────────────
const CancelSubModal = ({sub, onClose, onConfirm}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{background:C.white,borderRadius:14,width:420,padding:"28px",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
      <div style={{fontSize:T.xl,fontWeight:800,color:C.red,marginBottom:14}}>구독 해지</div>
      <div style={{background:C.redSoft,borderRadius:10,padding:"14px 16px",marginBottom:16}}>
        <div style={{fontWeight:700,color:C.text,marginBottom:4}}>{sub.storeName||sub.tenantName} · {sub.planName}</div>
        <div style={{fontSize:T.sm,color:C.textSub}}>{sub.subId}</div>
      </div>
      <div style={{fontSize:T.sm,color:C.text,marginBottom:8}}>해지 시 처리 내용:</div>
      <ul style={{margin:0,paddingLeft:18,fontSize:T.sm,color:C.textSub,lineHeight:1.8,marginBottom:18}}>
        <li>SubscriptionStatus → <b style={{color:C.red}}>CANCELLED</b></li>
        <li>해지일까지 서비스 유지, 이후 접근 차단</li>
        <li>해지 후 차회 청구서 미생성</li>
        <li>AuditLog 자동 기록</li>
      </ul>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <BtnGhost onClick={onClose}>취소</BtnGhost>
        <button onClick={()=>{onConfirm(sub.subId);onClose();}}
          style={{padding:"8px 18px",borderRadius:8,border:"none",background:C.red,color:"#fff",fontSize:T.sm,fontWeight:600,cursor:"pointer"}}>
          해지 확정
        </button>
      </div>
    </div>
  </div>
);

// ── BC-RP-001: 요금제 조회 ────────────────────────────────────────────────────
// ── 제공 기능 마스터 목록 ─────────────────────────────────────────────────────
const FEATURE_OPTIONS = {
  HQ: [
    {id:"f_dedicated",   label:"전용 테넌트 환경",     desc:"독립 데이터베이스 및 도메인"},
    {id:"f_custom_domain",label:"커스텀 도메인",        desc:"브랜드 전용 URL 설정"},
    {id:"f_cs_dedicated",label:"전담 CS 지원",          desc:"전담 AM 배정 및 SLA"},
    {id:"f_analytics",   label:"본사 통합 리포트",      desc:"전 가맹점 통합 대시보드"},
    {id:"f_api_access",  label:"API 외부 연동",         desc:"오픈 API 제공"},
    {id:"f_white_label", label:"화이트라벨 지원",       desc:"앱·화면 브랜딩 커스터마이징"},
  ],
  STORE: [
    {id:"f_pos",         label:"POS 연동",              desc:"키오스크·POS 실시간 연동"},
    {id:"f_inventory",   label:"재고 관리",             desc:"실시간 재고 추적 및 알림"},
    {id:"f_report",      label:"기본 리포트",           desc:"일/주/월 매출 리포트"},
    {id:"f_schedule",    label:"직원 스케줄 관리",      desc:"출퇴근·시프트 자동화"},
    {id:"f_delivery",    label:"배달 앱 연동",          desc:"배달의민족·쿠팡이츠 연동"},
    {id:"f_ai_coaching", label:"AI 코칭",               desc:"LLM 기반 운영 코칭"},
    {id:"f_rag",         label:"RAG 문서 검색",         desc:"매뉴얼·SOP 자동 검색"},
    {id:"f_ai_schedule", label:"AI 자동 일정 관리",     desc:"스케줄 AI 최적화"},
    {id:"f_smart_order", label:"스마트 발주",           desc:"AI 기반 자동 발주 추천"},
  ],
};

// ── 과금 추가 기준 옵션 ───────────────────────────────────────────────────────
const SURCHARGE_OPTIONS = [
  {id:"sc_store",    label:"가맹점 수 초과",     unit:"가맹점",  desc:"기준 수량 초과 시 가맹점당 추가 요금"},
  {id:"sc_user",     label:"활성 유저 수 초과",  unit:"명",      desc:"기준 유저 수 초과 시 인당 추가 요금"},
  {id:"sc_ai_call",  label:"AI 호출 수 초과",    unit:"회",      desc:"월 기준 호출 초과 시 건당 추가 요금"},
  {id:"sc_storage",  label:"데이터 용량 초과",   unit:"GB",      desc:"기준 용량 초과 시 GB당 추가 요금"},
  {id:"sc_api",      label:"API 요청 수 초과",   unit:"만 건",   desc:"월 기준 호출 초과 시 만건당 추가 요금"},
];

// ── 요금제 추가 모달 ──────────────────────────────────────────────────────────
const AddRatePlanModal = ({onClose, onAdd}) => {
  const [step, setStep]   = useState(1); // 1: 기본설정, 2: 과금기준, 3: 실행일정
  const STEPS = ["고객사 유형 · 기본 설정","요금 · 과금 추가 기준","제공 기능 · 실행 일정"];

  // ── 폼 상태 ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    // Step 1
    target:       "STORE",     // HQ | STORE
    planName:     "",
    planDesc:     "",
    billingCycle: "월",        // 월 | 1회
    visibility:   "공개",      // 공개 | 비공개
    // Step 2
    basePrice:    "",
    vatIncluded:  false,
    surcharges:   [],          // [{optionId, threshold, unitPrice}]
    // Step 3
    features:     [],          // feature ids
    effectiveType:"즉시",      // 즉시 | 예약
    effectiveDate:"",
    effectiveDay: "",          // 적용 시작 요일 (MON~SUN), 예약 선택 시 필수
    endDate:      "",
    hasEndDate:   false,
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const [errors, setErrors] = useState({});
  const featureList = FEATURE_OPTIONS[form.target] || [];

  // ── 유효성 검사 ──────────────────────────────────────────────────────────
  const validateStep = (s) => {
    const errs = {};
    if (s===1) {
      if (!form.planName.trim()) errs.planName = "요금제명을 입력하세요.";
    }
    if (s===2) {
      if (!form.basePrice || isNaN(Number(form.basePrice.replace(/,/g,"")))) errs.basePrice = "유효한 금액을 입력하세요.";
      form.surcharges.forEach((sc,i) => {
        if (!sc.threshold) errs[`sc_thr_${i}`] = "기준값 필요";
        if (!sc.unitPrice)  errs[`sc_up_${i}`]  = "단가 필요";
      });
    }
    if (s===3) {
      if (form.features.length===0) errs.features = "최소 1개 이상 제공 기능을 선택하세요.";
      if (form.effectiveType==="예약" && !form.effectiveDate) errs.effectiveDate = "적용 시작일을 선택하세요.";
      if (form.effectiveType==="예약" && !form.effectiveDay)  errs.effectiveDay  = "적용 시작 요일을 선택하세요.";
      if (form.hasEndDate && !form.endDate) errs.endDate = "종료일을 선택하세요.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validateStep(step)) setStep(s=>s+1); };
  const handleBack = () => { setStep(s=>s-1); setErrors({}); };

  const toggleFeature = (id) => {
    set("features", form.features.includes(id)
      ? form.features.filter(f=>f!==id)
      : [...form.features, id]);
    if (errors.features) setErrors(p=>({...p,features:null}));
  };

  const addSurcharge = (optionId) => {
    if (form.surcharges.find(s=>s.optionId===optionId)) return;
    set("surcharges", [...form.surcharges, {optionId, threshold:"", unitPrice:""}]);
  };
  const removeSurcharge = (optionId) => set("surcharges", form.surcharges.filter(s=>s.optionId!==optionId));
  const updateSurcharge = (optionId, field, value) =>
    set("surcharges", form.surcharges.map(s=>s.optionId===optionId?{...s,[field]:value}:s));

  const handleSubmit = () => {
    if (!validateStep(3)) return;
    const priceNum = Number(form.basePrice.replace(/,/g,""));
    const newPlan = {
      planId: `PLAN-${form.target==="HQ"?"HQ":"ST"}-${String(Date.now()).slice(-4)}`,
      planName: form.planName,
      price: priceNum,
      billingCycle: form.billingCycle,
      target: form.target,
      features: form.features.map(id=>featureList.find(f=>f.id===id)?.label||id),
      effectiveDate: form.effectiveType==="즉시" ? new Date().toISOString().split("T")[0] : form.effectiveDate,
      visibility: form.visibility,
      surcharges: form.surcharges,
      vatIncluded: form.vatIncluded,
      endDate: form.hasEndDate ? form.endDate : null,
    };
    onAdd(newPlan);
    onClose();
  };

  // ── 공통 스타일 ──────────────────────────────────────────────────────────
  const SLabel = ({children, required}) => (
    <div style={{fontSize:T.xs,fontWeight:600,color:C.textSub,marginBottom:5}}>
      {children}{required&&<span style={{color:C.red,marginLeft:2}}>*</span>}
    </div>
  );
  const ErrMsg = ({field}) => errors[field]
    ? <div style={{fontSize:T.xs,color:C.red,marginTop:3}}>{errors[field]}</div>
    : null;
  const inputStyle = (field) => ({
    width:"100%", padding:"9px 12px",
    border:`1.5px solid ${errors[field]?C.red:C.border}`,
    borderRadius:8, fontSize:T.sm, outline:"none", boxSizing:"border-box",
    transition:"border-color .2s",
  });

  // ── 스텝 인디케이터 ──────────────────────────────────────────────────────
  const StepBar = () => (
    <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:24}}>
      {STEPS.map((label,i)=>{
        const n = i+1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={n} style={{display:"flex",alignItems:"center",flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
              <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                background:done?C.green:active?C.blue:C.borderLight,
                border:`2px solid ${done?C.green:active?C.blue:C.border}`,
                transition:"all .25s"}}>
                {done
                  ? <Icon name="check" size={12} color="#fff"/>
                  : <span style={{fontSize:T.xs,fontWeight:700,color:active?"#fff":C.textMuted}}>{n}</span>}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:T.xs,fontWeight:active||done?700:400,color:active?C.blue:done?C.green:C.textMuted,whiteSpace:"nowrap"}}>{label}</div>
              </div>
            </div>
            {i<STEPS.length-1 && (
              <div style={{width:24,height:2,background:done?C.green:C.borderLight,margin:"0 6px",flexShrink:0,transition:"background .25s"}}/>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,27,45,0.55)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:C.white,borderRadius:16,width:620,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 28px 72px rgba(0,0,0,0.24)"}}>
        {/* 헤더 */}
        <div style={{padding:"24px 28px 0",position:"sticky",top:0,background:C.white,zIndex:10,borderBottom:`1px solid ${C.borderLight}`,paddingBottom:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
            <div>
              <div style={{fontSize:T.xl,fontWeight:800,color:C.text}}>요금제 추가</div>
              <div style={{fontSize:T.xs,color:C.textSub,marginTop:2,fontFamily:"monospace"}}>POST /api/v1/admin/rate-plans</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:20,padding:0,lineHeight:1}}>✕</button>
          </div>
          <StepBar/>
        </div>

        <div style={{padding:"22px 28px"}}>

          {/* ─────────────── STEP 1: 고객사 유형 · 기본 설정 ─────────────── */}
          {step===1 && (
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              {/* 고객사 유형 */}
              <div>
                <SLabel required>고객사 유형</SLabel>
                <div style={{display:"flex",gap:10}}>
                  {[{v:"HQ",label:"본사(HQ)",desc:"프랜차이즈 본사 단위 요금제",icon:"building",c:C.purple,b:C.purpleSoft},
                    {v:"STORE",label:"가맹점(STORE)",desc:"개별 가맹점 단위 요금제",icon:"creditcard",c:C.blue,b:C.blueSoft}].map(opt=>(
                    <div key={opt.v} onClick={()=>{set("target",opt.v);set("features",[]);}}
                      style={{flex:1,padding:"14px 16px",borderRadius:12,border:`2px solid ${form.target===opt.v?opt.c:C.border}`,background:form.target===opt.v?opt.b:C.white,cursor:"pointer",transition:"all .18s"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                        <div style={{width:32,height:32,borderRadius:8,background:form.target===opt.v?opt.c:C.borderLight,display:"flex",alignItems:"center",justifyContent:"center",transition:"background .18s"}}>
                          <Icon name={opt.icon} size={16} color={form.target===opt.v?"#fff":C.textMuted}/>
                        </div>
                        <span style={{fontWeight:700,fontSize:T.md,color:form.target===opt.v?opt.c:C.text}}>{opt.label}</span>
                      </div>
                      <div style={{fontSize:T.xs,color:C.textSub}}>{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* 요금제명 */}
              <div>
                <SLabel required>요금제명</SLabel>
                <input value={form.planName} onChange={e=>{set("planName",e.target.value);setErrors(p=>({...p,planName:null}));}}
                  placeholder={form.target==="HQ"?"예: 프랜차이즈 본사 커스텀 플러스":"예: 가맹점 AI 포함 솔루션"}
                  style={inputStyle("planName")}/>
                <ErrMsg field="planName"/>
              </div>
              {/* 요금제 설명 */}
              <div>
                <SLabel>요금제 설명</SLabel>
                <textarea value={form.planDesc} onChange={e=>set("planDesc",e.target.value)}
                  placeholder="요금제 특징, 적용 대상 등 내부 설명 (선택)"
                  rows={2}
                  style={{...inputStyle("planDesc"),resize:"vertical"}}/>
              </div>
              {/* 과금 주기 + 공개 여부 */}
              <div style={{display:"flex",gap:14}}>
                <div style={{flex:1}}>
                  <SLabel required>과금 주기</SLabel>
                  <div style={{display:"flex",gap:8}}>
                    {(form.target==="HQ"?["1회"]:["월","연간"]).map(v=>(
                      <button key={v} onClick={()=>set("billingCycle",v)}
                        style={{flex:1,padding:"9px 0",borderRadius:8,border:`2px solid ${form.billingCycle===v?C.blue:C.border}`,background:form.billingCycle===v?C.blueSoft:C.white,color:form.billingCycle===v?C.blue:C.textSub,fontWeight:form.billingCycle===v?700:400,fontSize:T.sm,cursor:"pointer",transition:"all .15s"}}>
                        {v==="월"?"월 단위":v==="연간"?"연간 (10% 할인)":"1회성"}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{flex:1}}>
                  <SLabel required>공개 여부</SLabel>
                  <div style={{display:"flex",gap:8}}>
                    {["공개","비공개"].map(v=>(
                      <button key={v} onClick={()=>set("visibility",v)}
                        style={{flex:1,padding:"9px 0",borderRadius:8,border:`2px solid ${form.visibility===v?(v==="공개"?C.green:C.orange):C.border}`,background:form.visibility===v?(v==="공개"?C.greenSoft:C.orangeSoft):C.white,color:form.visibility===v?(v==="공개"?C.green:C.orange):C.textSub,fontWeight:form.visibility===v?700:400,fontSize:T.sm,cursor:"pointer",transition:"all .15s"}}>
                        {v==="공개"?"공개 (가입 화면 노출)":"비공개 (내부 전용)"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────── STEP 2: 요금 · 과금 추가 기준 ─────────────── */}
          {step===2 && (
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              {/* 기본 요금 */}
              <div>
                <SLabel required>기본 요금</SLabel>
                <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{position:"relative"}}>
                      <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.textSub,fontSize:T.md,fontWeight:600}}>₩</span>
                      <input value={form.basePrice}
                        onChange={e=>{
                          const raw = e.target.value.replace(/[^0-9]/g,"");
                          set("basePrice", raw?Number(raw).toLocaleString("ko-KR"):"");
                          setErrors(p=>({...p,basePrice:null}));
                        }}
                        placeholder="0"
                        style={{...inputStyle("basePrice"), paddingLeft:24}}/>
                    </div>
                    <ErrMsg field="basePrice"/>
                  </div>
                  <div style={{padding:"10px 14px",background:C.bg,borderRadius:8,whiteSpace:"nowrap",fontSize:T.sm,color:C.textSub,alignSelf:"flex-start",marginTop:0}}>
                    {form.billingCycle==="1회"?"1회 납부":form.billingCycle==="연간"?"연간 청구":"월 청구"} /{" "}
                    {form.target==="HQ"?"테넌트":"가맹점"}
                  </div>
                </div>
                {/* VAT 포함 여부 */}
                <div onClick={()=>set("vatIncluded",!form.vatIncluded)}
                  style={{display:"inline-flex",alignItems:"center",gap:7,marginTop:9,cursor:"pointer"}}>
                  <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${form.vatIncluded?C.blue:C.border}`,background:form.vatIncluded?C.blue:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
                    {form.vatIncluded&&<Icon name="check" size={9} color="#fff"/>}
                  </div>
                  <span style={{fontSize:T.xs,color:C.textSub}}>VAT 포함 금액 <span style={{color:C.textMuted}}>(미체크 시 VAT 별도)</span></span>
                </div>
              </div>

              {/* 과금 추가 기준 */}
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:T.sm,fontWeight:700,color:C.text}}>과금 추가 기준 <span style={{fontSize:T.xs,fontWeight:400,color:C.textMuted}}>(선택)</span></div>
                    <div style={{fontSize:T.xs,color:C.textSub,marginTop:2}}>기준값 초과 시 단위당 추가 요금이 부과됩니다.</div>
                  </div>
                </div>
                {/* 추가 기준 선택 */}
                <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:12}}>
                  {SURCHARGE_OPTIONS.map(opt=>{
                    const active = form.surcharges.some(s=>s.optionId===opt.id);
                    return (
                      <button key={opt.id}
                        onClick={()=>active?removeSurcharge(opt.id):addSurcharge(opt.id)}
                        style={{padding:"5px 12px",borderRadius:7,border:`1.5px solid ${active?C.blue:C.border}`,background:active?C.blueSoft:C.white,color:active?C.blue:C.textSub,fontSize:T.xs,fontWeight:active?700:400,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",gap:5}}>
                        {active && <Icon name="check" size={11} color={C.blue}/>}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {/* 선택된 추가 기준 입력 */}
                {form.surcharges.length>0 && (
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {form.surcharges.map((sc,i)=>{
                      const opt = SURCHARGE_OPTIONS.find(o=>o.id===sc.optionId);
                      return (
                        <div key={sc.optionId} style={{padding:"14px 16px",background:C.blueSoft,borderRadius:10,border:`1px solid ${C.blue}33`}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                            <div>
                              <span style={{fontSize:T.sm,fontWeight:700,color:C.blue}}>{opt?.label}</span>
                              <span style={{fontSize:T.xs,color:C.textSub,marginLeft:8}}>{opt?.desc}</span>
                            </div>
                            <button onClick={()=>removeSurcharge(sc.optionId)}
                              style={{background:"none",border:"none",cursor:"pointer",color:C.textMuted,fontSize:16,lineHeight:1,padding:0}}>✕</button>
                          </div>
                          <div style={{display:"flex",gap:10}}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:T.xs,color:C.textSub,marginBottom:4}}>기준값 (이 {opt?.unit} 초과 시 부과)</div>
                              <div style={{display:"flex",alignItems:"center",gap:6}}>
                                <input value={sc.threshold}
                                  onChange={e=>updateSurcharge(sc.optionId,"threshold",e.target.value.replace(/[^0-9]/g,""))}
                                  placeholder="0"
                                  style={{flex:1,padding:"7px 10px",border:`1.5px solid ${errors[`sc_thr_${i}`]?C.red:C.border}`,borderRadius:7,fontSize:T.sm,outline:"none",background:C.white}}/>
                                <span style={{fontSize:T.xs,color:C.textSub,whiteSpace:"nowrap"}}>{opt?.unit}</span>
                              </div>
                              {errors[`sc_thr_${i}`] && <div style={{fontSize:T.xs,color:C.red,marginTop:2}}>{errors[`sc_thr_${i}`]}</div>}
                            </div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:T.xs,color:C.textSub,marginBottom:4}}>단위 추가 요금 (₩ / {opt?.unit})</div>
                              <div style={{display:"flex",alignItems:"center",gap:6}}>
                                <span style={{fontSize:T.sm,color:C.textSub}}>₩</span>
                                <input value={sc.unitPrice}
                                  onChange={e=>updateSurcharge(sc.optionId,"unitPrice",e.target.value.replace(/[^0-9]/g,""))}
                                  placeholder="0"
                                  style={{flex:1,padding:"7px 10px",border:`1.5px solid ${errors[`sc_up_${i}`]?C.red:C.border}`,borderRadius:7,fontSize:T.sm,outline:"none",background:C.white}}/>
                              </div>
                              {errors[`sc_up_${i}`] && <div style={{fontSize:T.xs,color:C.red,marginTop:2}}>{errors[`sc_up_${i}`]}</div>}
                            </div>
                          </div>
                          {sc.threshold && sc.unitPrice && (
                            <div style={{marginTop:8,padding:"6px 10px",background:"rgba(255,255,255,0.7)",borderRadius:6,fontSize:T.xs,color:C.blue}}>
                              예시: {opt?.unit} {sc.threshold} 초과 시, 초과분 {opt?.unit}당 ₩{Number(sc.unitPrice).toLocaleString("ko-KR")} 추가 청구
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {form.surcharges.length===0 && (
                  <div style={{padding:"14px",background:C.bg,borderRadius:9,fontSize:T.xs,color:C.textMuted,textAlign:"center"}}>
                    과금 추가 기준 없음 — 기본 요금만 청구됩니다.
                  </div>
                )}
              </div>

              {/* 요금 미리보기 */}
              {form.basePrice && (
                <div style={{padding:"14px 16px",background:C.bg,borderRadius:10,border:`1px solid ${C.border}`}}>
                  <div style={{fontSize:T.xs,fontWeight:700,color:C.textSub,marginBottom:8}}>요금 구성 미리보기</div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:T.sm,marginBottom:5}}>
                    <span style={{color:C.textSub}}>기본 요금</span>
                    <span style={{fontWeight:700}}>₩{form.basePrice} <span style={{fontSize:T.xs,color:C.textMuted}}>({form.vatIncluded?"VAT포함":"VAT별도"})</span></span>
                  </div>
                  {form.surcharges.filter(s=>s.threshold&&s.unitPrice).map(sc=>{
                    const opt = SURCHARGE_OPTIONS.find(o=>o.id===sc.optionId);
                    return (
                      <div key={sc.optionId} style={{display:"flex",justifyContent:"space-between",fontSize:T.sm,marginBottom:5}}>
                        <span style={{color:C.textSub}}>{opt?.label} 초과분</span>
                        <span style={{color:C.orange}}>+ ₩{Number(sc.unitPrice).toLocaleString("ko-KR")} / {opt?.unit}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─────────────── STEP 3: 제공 기능 · 실행 일정 ─────────────── */}
          {step===3 && (
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              {/* 제공 기능 */}
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:T.sm,fontWeight:700,color:C.text}}>제공 기능 선택 <span style={{color:C.red}}>*</span></div>
                    <div style={{fontSize:T.xs,color:C.textSub,marginTop:2}}>구독 고객에게 제공할 기능을 선택하세요.</div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>set("features",featureList.map(f=>f.id))}
                      style={{fontSize:T.xs,color:C.blue,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>전체선택</button>
                    <button onClick={()=>set("features",[])}
                      style={{fontSize:T.xs,color:C.textMuted,background:"none",border:"none",cursor:"pointer"}}>초기화</button>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {featureList.map(f=>{
                    const selected = form.features.includes(f.id);
                    return (
                      <div key={f.id} onClick={()=>toggleFeature(f.id)}
                        style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:9,border:`1.5px solid ${selected?C.blue:C.border}`,background:selected?C.blueSoft:C.white,cursor:"pointer",transition:"all .15s"}}>
                        <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${selected?C.blue:C.border}`,background:selected?C.blue:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>
                          {selected&&<Icon name="check" size={11} color="#fff"/>}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:T.sm,fontWeight:selected?700:400,color:selected?C.blue:C.text}}>{f.label}</div>
                          <div style={{fontSize:T.xs,color:C.textMuted,marginTop:1}}>{f.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {errors.features && <div style={{fontSize:T.xs,color:C.red,marginTop:6}}>{errors.features}</div>}
              </div>

              <div style={{height:1,background:C.borderLight}}/>

              {/* 실행 일정 */}
              <div>
                <div style={{fontSize:T.sm,fontWeight:700,color:C.text,marginBottom:12}}>실행 일정</div>
                {/* 적용 시작 */}
                <div style={{marginBottom:14}}>
                  <SLabel required>적용 시작</SLabel>
                  <div style={{display:"flex",gap:8,marginBottom:10}}>
                    {["즉시","예약"].map(v=>(
                      <button key={v} onClick={()=>{set("effectiveType",v);setErrors(p=>({...p,effectiveDate:null,effectiveDay:null}));}}
                        style={{flex:1,padding:"9px 0",borderRadius:8,border:`2px solid ${form.effectiveType===v?C.blue:C.border}`,background:form.effectiveType===v?C.blueSoft:C.white,color:form.effectiveType===v?C.blue:C.textSub,fontWeight:form.effectiveType===v?700:400,fontSize:T.sm,cursor:"pointer",transition:"all .15s"}}>
                        {v==="즉시"?"즉시 적용":"날짜 + 요일 지정 (예약)"}
                      </button>
                    ))}
                  </div>
                  {form.effectiveType==="즉시" && (
                    <div style={{padding:"8px 12px",background:C.greenSoft,borderRadius:7,fontSize:T.xs,color:C.green}}>
                      등록 즉시 적용됩니다. ({new Date().toISOString().split("T")[0]})
                    </div>
                  )}
                  {form.effectiveType==="예약" && (
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {/* 날짜 선택 */}
                      <div>
                        <div style={{fontSize:T.xs,fontWeight:600,color:C.textSub,marginBottom:5}}>적용 시작일 *</div>
                        <input type="date" value={form.effectiveDate}
                          min={(() => { const d=new Date(); d.setDate(d.getDate()+1); return d.toISOString().split("T")[0]; })()}
                          onChange={e=>{set("effectiveDate",e.target.value);setErrors(p=>({...p,effectiveDate:null}));}}
                          style={inputStyle("effectiveDate")}/>
                        <ErrMsg field="effectiveDate"/>
                      </div>
                      {/* 요일 선택 */}
                      <div>
                        <div style={{fontSize:T.xs,fontWeight:600,color:C.textSub,marginBottom:5}}>
                          적용 시작 요일 *
                          <span style={{fontWeight:400,color:C.textMuted,marginLeft:6}}>— 해당 요일부터 요금제가 활성화됩니다.</span>
                        </div>
                        <div style={{display:"flex",gap:6}}>
                          {[
                            {v:"MON",l:"월"},
                            {v:"TUE",l:"화"},
                            {v:"WED",l:"수"},
                            {v:"THU",l:"목"},
                            {v:"FRI",l:"금"},
                            {v:"SAT",l:"토"},
                            {v:"SUN",l:"일"},
                          ].map(day=>{
                            const sel = form.effectiveDay===day.v;
                            // 오늘 요일 계산해서 당일 표시
                            const todayDow = ["SUN","MON","TUE","WED","THU","FRI","SAT"][new Date().getDay()];
                            const isToday  = day.v === todayDow;
                            return (
                              <div key={day.v}
                                onClick={()=>{set("effectiveDay",day.v);setErrors(p=>({...p,effectiveDay:null}));}}
                                title={isToday?"등록 당일 요일 — 적용되지 않습니다":""}
                                style={{
                                  width:42, height:42, borderRadius:10, display:"flex", flexDirection:"column",
                                  alignItems:"center", justifyContent:"center", cursor:"pointer",
                                  border:`2px solid ${sel?C.blue:errors.effectiveDay?C.red:C.border}`,
                                  background:sel?C.blue:C.white, transition:"all .15s", position:"relative",
                                  opacity: isToday? 0.45 : 1,
                                }}>
                                <span style={{fontSize:T.sm,fontWeight:sel?700:500,color:sel?"#fff":C.text}}>{day.l}</span>
                                {isToday && (
                                  <span style={{position:"absolute",top:2,right:2,width:6,height:6,borderRadius:"50%",background:C.orange}}/>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {errors.effectiveDay && <div style={{fontSize:T.xs,color:C.red,marginTop:4}}>{errors.effectiveDay}</div>}
                        <div style={{marginTop:8,padding:"7px 12px",background:C.orangeSoft,borderRadius:7,fontSize:T.xs,color:C.orange}}>
                          ※ 적용 요일은 <b>등록 당일(오렌지 점 표시)에는 작동하지 않습니다.</b> 해당 요일 00:00 KST부터 활성화됩니다.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* 종료일 */}
                <div style={{marginBottom:14}}>
                  <div onClick={()=>{set("hasEndDate",!form.hasEndDate);set("endDate","");setErrors(p=>({...p,endDate:null}));}}
                    style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:form.hasEndDate?10:0}}>
                    <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${form.hasEndDate?C.blue:C.border}`,background:form.hasEndDate?C.blue:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
                      {form.hasEndDate&&<Icon name="check" size={10} color="#fff"/>}
                    </div>
                    <span style={{fontSize:T.sm,color:form.hasEndDate?C.text:C.textSub,fontWeight:form.hasEndDate?600:400}}>
                      종료일 설정 <span style={{fontSize:T.xs,color:C.textMuted}}>(미설정 시 무기한)</span>
                    </span>
                  </div>
                  {form.hasEndDate && (
                    <div>
                      <input type="date" value={form.endDate}
                        onChange={e=>{set("endDate",e.target.value);setErrors(p=>({...p,endDate:null}));}}
                        style={inputStyle("endDate")}/>
                      <ErrMsg field="endDate"/>
                    </div>
                  )}
                </div>
              </div>

              {/* 최종 확인 요약 */}
              <div style={{padding:"16px 18px",background:C.bg,borderRadius:12,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:T.sm,fontWeight:700,color:C.text,marginBottom:12}}>등록 요약</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    ["고객사 유형", form.target==="HQ"?"본사(HQ)":"가맹점(STORE)"],
                    ["요금제명", form.planName||"—"],
                    ["기본 요금", form.basePrice?`₩${form.basePrice} (${form.vatIncluded?"VAT포함":"VAT별도"})`:"—"],
                    ["과금 주기", form.billingCycle],
                    ["공개 여부", form.visibility],
                    ["제공 기능 수", `${form.features.length}개`],
                    ["과금 추가 기준", form.surcharges.length>0?`${form.surcharges.length}개 조건`:"없음"],
                    ["적용 시작", form.effectiveType==="즉시"?"즉시 적용":form.effectiveDate||"—"],
                    ["적용 요일", form.effectiveType==="즉시"?"—":(form.effectiveDay?{MON:"월",TUE:"화",WED:"수",THU:"목",FRI:"금",SAT:"토",SUN:"일"}[form.effectiveDay]+"요일":"미선택")],
                    ["종료일", form.hasEndDate?form.endDate||"—":"무기한"],
                  ].map(([k,v])=>(
                    <div key={k} style={{padding:"8px 10px",background:C.white,borderRadius:7}}>
                      <div style={{fontSize:T.xs,color:C.textMuted,marginBottom:2}}>{k}</div>
                      <div style={{fontSize:T.sm,fontWeight:600,color:C.text}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 하단 버튼 ── */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:24,paddingTop:18,borderTop:`1px solid ${C.borderLight}`}}>
            <div>
              {step>1 && <BtnGhost onClick={handleBack}><Icon name="chevronLeft" size={14} color={C.textSub}/>이전</BtnGhost>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <BtnGhost onClick={onClose}>취소</BtnGhost>
              {step<3
                ? <BtnPrimary onClick={handleNext}>다음 <Icon name="chevronRight" size={14} color="#fff"/></BtnPrimary>
                : <BtnPrimary onClick={handleSubmit} style={{background:C.green}}>
                    <Icon name="check" size={14} color="#fff"/>요금제 등록
                  </BtnPrimary>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── BC-RP-001: 요금제 조회 탭 (stateful) ─────────────────────────────────────
const RatePlanTab = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [plans, setPlans]     = useState(RATE_PLANS);
  const [toast, setToast]     = useState(null);
  const showMsg = (msg,type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const handleAdd = (newPlan) => {
    setPlans(p=>[...p, newPlan]);
    showMsg(`요금제 "${newPlan.planName}" 등록 완료`, "success");
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      {showAdd && <AddRatePlanModal onClose={()=>setShowAdd(false)} onAdd={handleAdd}/>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:T.sm,color:C.textSub}}>현재 운영 중인 요금제 목록 · GET /api/v1/admin/rate-plans</div>
        <BtnPrimary style={{padding:"6px 16px",fontSize:T.xs}} onClick={()=>setShowAdd(true)}>
          <Icon name="plus" size={13} color="#fff"/>요금제 추가
        </BtnPrimary>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {plans.map(plan=>(
          <Card key={plan.planId} style={{border:`1px solid ${plan.target==="HQ"?C.purple+"44":C.blue+"33"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{width:40,height:40,borderRadius:10,background:plan.target==="HQ"?C.purpleSoft:C.blueSoft,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Icon name={plan.target==="HQ"?"building":"creditcard"} size={19} color={plan.target==="HQ"?C.purple:C.blue}/>
                </div>
                <div>
                  <div style={{fontSize:T.md,fontWeight:800,color:C.text}}>{plan.planName}</div>
                  <div style={{fontSize:T.xs,color:C.textMuted,marginTop:2,fontFamily:"monospace"}}>{plan.planId}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <Badge label={plan.visibility} color={plan.visibility==="공개"?C.green:C.textMuted} bg={plan.visibility==="공개"?C.greenSoft:C.borderLight}/>
                <Badge label={plan.target==="HQ"?"본사 대상":"매장 대상"} color={plan.target==="HQ"?C.purple:C.blue} bg={plan.target==="HQ"?C.purpleSoft:C.blueSoft}/>
                {plan.endDate && <Badge label={`~${plan.endDate}`} color={C.orange} bg={C.orangeSoft}/>}
                <BtnGhost style={{padding:"4px 10px",fontSize:T.xs}}>수정</BtnGhost>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:14}}>
              {[
                ["기본 요금",`₩${fmt(plan.price)}`],
                ["과금 주기",plan.billingCycle],
                ["VAT",plan.vatIncluded?"포함":"별도"],
                ["적용 시작",plan.effectiveDate],
                ["구독 중",`${SUBSCRIPTIONS_DATA.filter(s=>s.planId===plan.planId&&s.status==="ACTIVE").length}건`],
              ].map(([k,v])=>(
                <div key={k} style={{padding:"10px 12px",background:C.bg,borderRadius:8}}>
                  <div style={{fontSize:T.xs,color:C.textMuted,marginBottom:3}}>{k}</div>
                  <div style={{fontSize:T.md,fontWeight:700,color:C.text}}>{v}</div>
                </div>
              ))}
            </div>
            {/* 과금 추가 기준 표시 */}
            {plan.surcharges && plan.surcharges.length>0 && (
              <div style={{marginBottom:12,padding:"10px 14px",background:C.orangeSoft,borderRadius:8,border:`1px solid ${C.orange}33`}}>
                <div style={{fontSize:T.xs,fontWeight:700,color:C.orange,marginBottom:6}}>과금 추가 기준</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {plan.surcharges.map(sc=>{
                    const opt = SURCHARGE_OPTIONS.find(o=>o.id===sc.optionId);
                    return (
                      <span key={sc.optionId} style={{fontSize:T.xs,padding:"3px 9px",borderRadius:5,background:C.white,color:C.orange,fontWeight:500}}>
                        {opt?.label} {sc.threshold}{opt?.unit} 초과 → ₩{Number(sc.unitPrice).toLocaleString("ko-KR")}/{opt?.unit}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <span style={{fontSize:T.xs,color:C.textSub,fontWeight:500,marginRight:4}}>제공 기능:</span>
              {plan.features.map(f=>(
                <span key={f} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:T.xs,padding:"3px 9px",borderRadius:6,background:C.bg,color:C.textSub}}>
                  <Icon name="check" size={10} color={C.green}/>{f}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ── 사용유형 배지 ──────────────────────────────────────────────────────────────
const UsageTypeBadge = ({type}) => {
  const m = {
    PAID: {l:"PAID",    c:C.blue,    b:C.blueSoft},
    FREE: {l:"FREE",    c:C.green,   b:C.greenSoft},
    EVENT:{l:"EVENT",   c:C.purple,  b:C.purpleSoft},
  };
  const s = m[type]||{l:type,c:C.textMuted,b:C.borderLight};
  return <Badge label={s.l} color={s.c} bg={s.b}/>;
};

// ── EVENT 무료기간 설정 모달 ──────────────────────────────────────────────────
const EventModal = ({sub, onClose, onConfirm}) => {
  const [eventUntil, setEventUntil] = useState("");
  const [eventNote, setEventNote]   = useState("");
  const [error, setError]           = useState("");
  const today = new Date().toISOString().split("T")[0];
  const handleSubmit = () => {
    if (!eventUntil) { setError("무료 종료일을 선택하세요."); return; }
    if (eventUntil <= today) { setError("종료일은 오늘 이후여야 합니다."); return; }
    onConfirm(sub.subId, eventUntil, eventNote);
    onClose();
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,27,45,0.5)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C.white,borderRadius:14,width:440,padding:"28px",boxShadow:"0 20px 60px rgba(0,0,0,0.22)"}}>
        <div style={{fontSize:T.xl,fontWeight:800,color:C.purple,marginBottom:4}}>EVENT 무료 기간 설정</div>
        <div style={{fontSize:T.xs,color:C.textSub,marginBottom:18}}>관리자가 지정한 무료 사용 기간을 설정합니다. (PATCH /api/v1/admin/subscriptions/{sub.subId}/usage-type)</div>
        <div style={{background:C.purpleSoft,borderRadius:10,padding:"12px 14px",marginBottom:16}}>
          <div style={{fontSize:T.xs,color:C.textMuted,marginBottom:2}}>대상 구독</div>
          <div style={{fontWeight:700,color:C.text}}>{sub.storeName||sub.tenantName} · {sub.planName}</div>
          <div style={{fontFamily:"monospace",fontSize:T.xs,color:C.purple,marginTop:2}}>{sub.subId}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:18}}>
          <div>
            <div style={{fontSize:T.xs,fontWeight:600,color:C.textSub,marginBottom:5}}>무료 종료일 *</div>
            <input type="date" value={eventUntil} min={today}
              onChange={e=>{setEventUntil(e.target.value);setError("");}}
              style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${error?C.red:C.border}`,borderRadius:8,fontSize:T.sm,outline:"none",boxSizing:"border-box"}}/>
            {error && <div style={{fontSize:T.xs,color:C.red,marginTop:3}}>{error}</div>}
          </div>
          <div>
            <div style={{fontSize:T.xs,fontWeight:600,color:C.textSub,marginBottom:5}}>EVENT 사유 <span style={{color:C.textMuted}}>(선택)</span></div>
            <input value={eventNote} onChange={e=>setEventNote(e.target.value)}
              placeholder="예: 런칭 프로모션, 파트너 협약 등"
              style={{width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:T.sm,outline:"none",boxSizing:"border-box"}}/>
          </div>
        </div>
        <div style={{padding:"10px 14px",background:C.purpleSoft,borderRadius:9,fontSize:T.xs,color:C.purple,marginBottom:18}}>
          종료일 이후 UsageType → PAID 자동 전환. AuditLog 기록.
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <BtnGhost onClick={onClose}>취소</BtnGhost>
          <BtnPrimary onClick={handleSubmit} style={{background:C.purple}}>EVENT 적용</BtnPrimary>
        </div>
      </div>
    </div>
  );
};

// ── FREE 14일 무료 체험 모달 ─────────────────────────────────────────────────
const FreeTrialModal = ({sub, onClose, onConfirm}) => {
  const startDate = new Date();
  const endDate   = new Date(startDate); endDate.setDate(endDate.getDate()+14);
  const fmt8      = d => d.toISOString().split("T")[0];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,27,45,0.5)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C.white,borderRadius:14,width:420,padding:"28px",boxShadow:"0 20px 60px rgba(0,0,0,0.22)"}}>
        <div style={{fontSize:T.xl,fontWeight:800,color:C.green,marginBottom:4}}>FREE 14일 무료 체험 적용</div>
        <div style={{fontSize:T.xs,color:C.textSub,marginBottom:18}}>가맹점 솔루션 구독에 한해 14일간 무료 서비스를 제공합니다. 본사 커스텀 요금제는 제외됩니다.</div>
        <div style={{background:C.greenSoft,borderRadius:10,padding:"14px 16px",marginBottom:16}}>
          {[
            ["대상",sub.storeName||sub.tenantName],
            ["요금제",sub.planName],
            ["무료 시작일",fmt8(startDate)],
            ["무료 종료일",fmt8(endDate)],
          ].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:T.sm}}>
              <span style={{color:C.textSub}}>{k}</span>
              <span style={{fontWeight:600,color:C.text}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{padding:"10px 14px",background:C.orangeSoft,borderRadius:9,fontSize:T.xs,color:C.orange,marginBottom:18}}>
          ※ 본사 커스텀(HQ) 요금제는 FREE 체험 적용 불가. 종료 후 UsageType → PAID 자동 전환.
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <BtnGhost onClick={onClose}>취소</BtnGhost>
          <BtnPrimary onClick={()=>{onConfirm(sub.subId, fmt8(endDate));onClose();}} style={{background:C.green}}>
            무료 체험 적용
          </BtnPrimary>
        </div>
      </div>
    </div>
  );
};

// ── BC-RP-002: 구독 관리 ──────────────────────────────────────────────────────
const SubscriptionTab = () => {
  const [filter, setFilter]             = useState("전체");
  const [usageFilter, setUsageFilter]   = useState("전체");
  const [toast, setToast]               = useState(null);
  const [changePlanModal, setChangePlanModal] = useState(null);
  const [cancelModal, setCancelModal]   = useState(null);
  const [eventModal, setEventModal]     = useState(null);
  const [freeModal, setFreeModal]       = useState(null);
  const [subs, setSubs]                 = useState(SUBSCRIPTIONS_DATA);

  const showMsg = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const handleChangePlan = (subId, newPlanId, newPlanName, newPrice) => {
    setSubs(p=>p.map(s=>s.subId===subId?{...s,planId:newPlanId,planName:newPlanName,amount:newPrice}:s));
    showMsg("요금제 변경 신청 완료. 차회 청구부터 적용됩니다.");
  };
  const handleCancel = (subId) => {
    setSubs(p=>p.map(s=>s.subId===subId?{...s,status:"CANCELLED",dueDate:"—",cancelledDate:"2025-02-28"}:s));
    showMsg("구독이 해지되었습니다. SubscriptionStatus → CANCELLED", "warn");
  };
  const handleEvent = (subId, eventUntil, eventNote) => {
    setSubs(p=>p.map(s=>s.subId===subId?{...s,usageType:"EVENT",eventUntil,eventNote}:s));
    showMsg(`EVENT 무료 기간 설정 완료. (~${eventUntil})`);
  };
  const handleFree = (subId, freeUntil) => {
    setSubs(p=>p.map(s=>s.subId===subId?{...s,usageType:"FREE",freeUntil}:s));
    showMsg("FREE 14일 무료 체험 적용 완료.");
  };

  // 필터 적용
  const filtered = subs
    .filter(s=>filter==="전체"||s.status===filter)
    .filter(s=>usageFilter==="전체"||s.usageType===usageFilter);

  const statusCounts  = ["ACTIVE","SUSPENDED","CANCELLED"].reduce((acc,s)=>({...acc,[s]:subs.filter(x=>x.status===s).length}),{});
  const usageCounts   = ["PAID","FREE","EVENT"].reduce((acc,u)=>({...acc,[u]:subs.filter(x=>x.usageType===u).length}),{});

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      {changePlanModal && <ChangePlanModal sub={changePlanModal} onClose={()=>setChangePlanModal(null)} onConfirm={handleChangePlan}/>}
      {cancelModal     && <CancelSubModal  sub={cancelModal}    onClose={()=>setCancelModal(null)}    onConfirm={handleCancel}/>}
      {eventModal      && <EventModal      sub={eventModal}     onClose={()=>setEventModal(null)}     onConfirm={handleEvent}/>}
      {freeModal       && <FreeTrialModal  sub={freeModal}      onClose={()=>setFreeModal(null)}      onConfirm={handleFree}/>}

      {/* KPI */}
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        {[["총 구독",subs.length+"건",C.blue],["ACTIVE",statusCounts.ACTIVE+"건",C.green],["SUSPENDED",statusCounts.SUSPENDED+"건",C.red],["CANCELLED",statusCounts.CANCELLED+"건",C.textMuted]].map(([l,v,c])=>(
          <div key={l} style={{flex:1,minWidth:"140px",padding:"14px 16px",background:C.white,borderRadius:10,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:T.xs,color:C.textSub,marginBottom:4}}>{l}</div>
            <div style={{fontSize:T["2xl"],fontWeight:800,color:c}}>{v}</div>
          </div>
        ))}
      </div>

      {/* 상태 필터 + 사용유형 필터 */}
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {/* 상태 필터 */}
        <div style={{display:"flex",gap:6}}>
          {["전체","ACTIVE","SUSPENDED","CANCELLED"].map(f=>{
            const cnt = f==="전체"?subs.length:subs.filter(s=>s.status===f).length;
            const active = filter===f;
            const fc = f==="ACTIVE"?C.green:f==="SUSPENDED"?C.red:f==="CANCELLED"?C.textMuted:C.blue;
            return (
              <button key={f} onClick={()=>setFilter(f)}
                style={{padding:"5px 12px",borderRadius:7,border:`1.5px solid ${active?(f==="전체"?C.blue:fc):C.border}`,background:active?(f==="전체"?C.blue:fc+"18"):C.white,color:active?(f==="전체"?C.white:fc):C.textSub,fontSize:T.sm,fontWeight:active?700:500,cursor:"pointer"}}>
                {f} <span style={{opacity:.7,fontSize:T.xs}}>({cnt})</span>
              </button>
            );
          })}
        </div>
        {/* 사용유형 필터 */}
        <div style={{width:1,height:20,background:C.border}}/>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:T.xs,color:C.textMuted,fontWeight:500}}>사용유형</span>
          {["전체","PAID","FREE","EVENT"].map(u=>{
            const cnt  = u==="전체"?subs.length:subs.filter(s=>s.usageType===u).length;
            const act  = usageFilter===u;
            const uc   = u==="FREE"?C.green:u==="EVENT"?C.purple:C.blue;
            return (
              <button key={u} onClick={()=>setUsageFilter(u)}
                style={{padding:"4px 10px",borderRadius:7,border:`1.5px solid ${act?(u==="전체"?C.blue:uc):C.border}`,background:act?(u==="전체"?C.blueSoft:uc+"18"):C.white,color:act?(u==="전체"?C.blue:uc):C.textSub,fontSize:T.xs,fontWeight:act?700:500,cursor:"pointer"}}>
                {u} <span style={{opacity:.7}}>({cnt})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 사용유형 설명 배너 */}
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        {[
          {type:"FREE",  c:C.green,  b:C.greenSoft,  desc:"14일간 무료 사용 (가맹점 솔루션 전용, 본사 커스텀 제외)"},
          {type:"EVENT", c:C.purple, b:C.purpleSoft, desc:"관리자 지정 무료 기간 — 프로모션·파트너 협약 등"},
        ].map(({type,c,b,desc})=>(
          <div key={type} style={{flex:1,display:"flex",alignItems:"center",gap:9,padding:"9px 14px",background:b,borderRadius:9,border:`1px solid ${c}33`}}>
            <Badge label={type} color={c} bg={b}/>
            <span style={{fontSize:T.xs,color:c,fontWeight:500}}>{desc}</span>
          </div>
        ))}
      </div>

      <Card>
        <Table
          cols={["구독 ID","고객사","매장","요금제","사용유형","요금총액","부가세","납기일","납부일","납부방법","상태","액션"]}
          rows={filtered}
          renderRow={sub=>{
            const vat = sub.usageType!=="PAID" ? 0 : Math.round(sub.amount * 0.1);
            return <>
              <Td><span style={{fontFamily:"monospace",fontSize:T.xs,color:C.blue,fontWeight:600}}>{sub.subId}</span></Td>
              <Td style={{fontWeight:600,fontSize:T.sm}}>{sub.tenantName}</Td>
              <Td style={{fontSize:T.xs,color:C.textSub}}>{sub.storeName||<span style={{color:C.textMuted}}>HQ</span>}</Td>
              <Td>
                <div style={{fontSize:T.sm,fontWeight:600,color:C.text}}>{sub.planName}</div>
                <div style={{fontSize:T.xs,color:C.textMuted,fontFamily:"monospace"}}>{sub.planId}</div>
              </Td>
              <Td>
                <UsageTypeBadge type={sub.usageType}/>
                {sub.usageType==="FREE"  && sub.freeUntil  && <div style={{fontSize:T.xs,color:C.textMuted,marginTop:2}}>~{sub.freeUntil}</div>}
                {sub.usageType==="EVENT" && sub.eventUntil && <div style={{fontSize:T.xs,color:C.purple,marginTop:2}}>~{sub.eventUntil}</div>}
                {sub.usageType==="EVENT" && sub.eventNote  && <div style={{fontSize:T.xs,color:C.textMuted,marginTop:1}}>{sub.eventNote}</div>}
              </Td>
              <Td style={{fontWeight:700}}>
                {sub.usageType!=="PAID"
                  ? <span style={{color:C.green,fontWeight:700}}>₩0 <span style={{fontSize:T.xs,color:C.textMuted,fontWeight:400}}>(무료)</span></span>
                  : `₩${fmt(sub.amount)}`}
              </Td>
              <Td style={{color:sub.usageType!=="PAID"?C.textMuted:C.textSub,fontSize:T.sm}}>
                {sub.usageType!=="PAID" ? "—" : `₩${fmt(vat)}`}
              </Td>
              <Td style={{color:sub.dueDate==="—"?C.textMuted:C.textSub,fontSize:T.xs}}>{sub.dueDate||"—"}</Td>
              <Td style={{color:C.textSub,fontSize:T.xs}}>{sub.paidAt||"—"}</Td>
              <Td><PayMethodBadge method={sub.paymentMethod}/></Td>
              <Td><SubStatusBadge status={sub.status}/></Td>
              <Td>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {sub.status==="ACTIVE" && sub.billingCycle==="월" && sub.usageType==="PAID" && (
                    <BtnGhost style={{padding:"3px 7px",fontSize:T.xs}} onClick={()=>setChangePlanModal(sub)}>요금제 변경</BtnGhost>
                  )}
                  {sub.status==="ACTIVE" && sub.usageType==="PAID" && sub.planId!=="PLAN-HQ-001" && (
                    <button onClick={()=>setFreeModal(sub)}
                      style={{padding:"3px 7px",borderRadius:5,border:`1px solid ${C.green}55`,background:C.greenSoft,color:C.green,fontSize:T.xs,fontWeight:600,cursor:"pointer"}}>FREE</button>
                  )}
                  {sub.status==="ACTIVE" && (
                    <button onClick={()=>setEventModal(sub)}
                      style={{padding:"3px 7px",borderRadius:5,border:`1px solid ${C.purple}55`,background:C.purpleSoft,color:C.purple,fontSize:T.xs,fontWeight:600,cursor:"pointer"}}>EVENT</button>
                  )}
                  {sub.status==="ACTIVE" && (
                    <button onClick={()=>setCancelModal(sub)}
                      style={{padding:"3px 7px",borderRadius:5,border:`1px solid ${C.red}44`,background:C.redSoft,color:C.red,fontSize:T.xs,fontWeight:600,cursor:"pointer"}}>해지</button>
                  )}
                </div>
              </Td>
            </>;
          }}
        />
      </Card>
    </div>
  );
};

// ── BC-SALES-002: 청구 내역 ───────────────────────────────────────────────────
const InvoiceTab = () => {
  const [filter, setFilter] = useState("전체");
  const [paidModal, setPaidModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [invoices, setInvoices] = useState(INVOICES_DATA);

  const showMsg = (msg,type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const handlePaidConfirm = (invoiceId, form) => {
    setInvoices(p=>p.map(inv=>inv.invoiceId===invoiceId?{...inv,status:"PAID",paidAt:form.paidAt,paymentMethod:form.paymentMethod,transactionId:form.transactionId}:inv));
    showMsg("납부 확인 완료. InvoiceStatus → PAID. AuditLog 기록됨.", "success");
  };

  const filtered = filter==="전체"?invoices:invoices.filter(inv=>inv.status===filter);
  const totalRevenue  = invoices.filter(i=>i.status==="PAID").reduce((s,i)=>s+i.amount,0);
  const pendingAmount = invoices.filter(i=>i.status!=="PAID"&&i.status!=="CANCELLED").reduce((s,i)=>s+i.amount,0);
  const overdueCount  = invoices.filter(i=>i.status==="OVERDUE").length;

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      {paidModal && <PaidConfirmModal invoice={paidModal} onClose={()=>setPaidModal(null)} onConfirm={handlePaidConfirm}/>}
      {/* KPI */}
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{flex:1,padding:"14px 18px",background:C.white,borderRadius:10,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:T.xs,color:C.textSub,marginBottom:4}}>이번달 수납액</div>
          <div style={{fontSize:T["2xl"],fontWeight:800,color:C.green}}>₩{fmt(totalRevenue)}</div>
          <div style={{fontSize:T.xs,color:C.textMuted,marginTop:2}}>{invoices.filter(i=>i.status==="PAID").length}건 납부완료</div>
        </div>
        <div style={{flex:1,padding:"14px 18px",background:C.white,borderRadius:10,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:T.xs,color:C.textSub,marginBottom:4}}>미수금 합계</div>
          <div style={{fontSize:T["2xl"],fontWeight:800,color:C.orange}}>₩{fmt(pendingAmount)}</div>
          <div style={{fontSize:T.xs,color:C.textMuted,marginTop:2}}>{invoices.filter(i=>["PENDING","OVERDUE"].includes(i.status)).length}건 미납</div>
        </div>
        <div style={{flex:1,padding:"14px 18px",background:C.white,borderRadius:10,border:`1px solid ${overdueCount>0?C.red:C.border}`,borderWidth: overdueCount>0?"1.5px":"1px"}}>
          <div style={{fontSize:T.xs,color:C.textSub,marginBottom:4}}>연체 건수</div>
          <div style={{fontSize:T["2xl"],fontWeight:800,color:overdueCount>0?C.red:C.textMuted}}>{overdueCount}건</div>
          {overdueCount>0 && <div style={{fontSize:T.xs,color:C.red,marginTop:2}}>14일 경과 시 자동 SUSPENDED</div>}
        </div>
        <div style={{flex:1,padding:"14px 18px",background:C.white,borderRadius:10,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:T.xs,color:C.textSub,marginBottom:4}}>총 청구 건수</div>
          <div style={{fontSize:T["2xl"],fontWeight:800,color:C.blue}}>{invoices.length}건</div>
          <div style={{fontSize:T.xs,color:C.textMuted,marginTop:2}}>2025년 2월 기준</div>
        </div>
      </div>
      {/* 연체 경고 배너 */}
      {overdueCount>0 && (
        <div style={{background:C.redSoft,border:`1px solid ${C.red}44`,borderRadius:10,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
          <Icon name="alert" size={16} color={C.red}/>
          <div style={{flex:1}}>
            <span style={{fontSize:T.sm,fontWeight:700,color:C.red}}>연체 {overdueCount}건 확인 필요</span>
            <span style={{fontSize:T.xs,color:C.textSub,marginLeft:10}}>납기일 경과 청구서입니다. 14일 초과 시 TenantStatus/StoreStatus → SUSPENDED 자동 전환됩니다.</span>
          </div>
          <BtnGhost style={{padding:"4px 12px",fontSize:T.xs}}>연체만 보기</BtnGhost>
        </div>
      )}
      {/* 필터 + 내보내기 */}
      <div style={{display:"flex",gap:7,marginBottom:14,alignItems:"center"}}>
        {["전체","PENDING","PAID","OVERDUE","CANCELLED"].map(f=>{
          const cnt = f==="전체"?invoices.length:invoices.filter(i=>i.status===f).length;
          const active = filter===f;
          const fc = f==="PAID"?C.green:f==="PENDING"?C.orange:f==="OVERDUE"?C.red:f==="CANCELLED"?C.textMuted:C.blue;
          return (
            <button key={f} onClick={()=>setFilter(f)}
              style={{padding:"5px 12px",borderRadius:7,border:`1.5px solid ${active?(f==="전체"?C.blue:fc):C.border}`,background:active?(f==="전체"?C.blue:fc+"18"):C.white,color:active?(f==="전체"?C.white:fc):C.textSub,fontSize:T.sm,fontWeight:active?700:500,cursor:"pointer"}}>
              {f} <span style={{opacity:0.7,fontSize:T.xs}}>({cnt})</span>
            </button>
          );
        })}
        <div style={{flex:1}}/>
        <BtnGhost style={{padding:"5px 12px",fontSize:T.xs}}>
          <Icon name="download" size={13} color={C.textSub}/>엑셀 다운로드
        </BtnGhost>
        <div style={{fontSize:T.xs,color:C.textMuted,fontFamily:"monospace"}}>GET /api/v1/admin/invoices</div>
      </div>
      <Card>
        <Table
          cols={["인보이스 ID","HQ","매장","요금제","청구금액","발행일","납기일","납부일","납부방법","상태","액션"]}
          rows={filtered}
          renderRow={inv=><>
            <Td><span style={{fontFamily:"monospace",fontSize:T.xs,color:C.blue,fontWeight:600}}>{inv.invoiceId}</span></Td>
            <Td style={{fontWeight:600,fontSize:T.sm}}>{inv.tenantName}</Td>
            <Td style={{fontSize:T.xs,color:C.textSub}}>{inv.storeName||<span style={{color:C.textMuted}}>HQ</span>}</Td>
            <Td style={{fontSize:T.xs,color:C.textSub}}>{inv.planName}</Td>
            <Td style={{fontWeight:700}}>₩{fmt(inv.amount)}</Td>
            <Td style={{color:C.textMuted,fontSize:T.xs}}>{inv.issueDate}</Td>
            <Td style={{color:inv.status==="OVERDUE"?C.red:C.textMuted,fontWeight:inv.status==="OVERDUE"?700:400,fontSize:T.xs}}>{inv.dueDate}</Td>
            <Td style={{color:C.textSub,fontSize:T.xs}}>{inv.paidAt||"—"}</Td>
            <Td><PayMethodBadge method={inv.paymentMethod}/></Td>
            <Td><InvoiceBadge status={inv.status}/></Td>
            <Td>
              {(inv.status==="PENDING"||inv.status==="OVERDUE") && (
                <BtnPrimary style={{padding:"3px 10px",fontSize:T.xs}} onClick={()=>setPaidModal(inv)}>
                  <Icon name="check" size={11} color="#fff"/>납부확인
                </BtnPrimary>
              )}
              {inv.status==="PAID" && inv.transactionId && (
                <span style={{fontFamily:"monospace",fontSize:T.xs,color:C.textMuted}}>{inv.transactionId}</span>
              )}
            </Td>
          </>}
        />
      </Card>
    </div>
  );
};

// ── BC-SALES-001: 요금제·매출 개요 ───────────────────────────────────────────
const RevenueOverviewTab = () => {
  const totalMRR      = HQ_LIST.reduce((s,h)=>s+h.mrr,0);
  const planGroups    = [{label:"Enterprise",count:1,mrr:1200000,color:C.purple},{label:"Special",count:2,mrr:750000,color:C.blue},{label:"Basic",count:2,mrr:210000,color:C.textMuted}];
  const hqCustomCount = SUBSCRIPTIONS_DATA.filter(s=>s.planId==="PLAN-HQ-001"&&s.status==="ACTIVE").length;

  // 구독별 매출 계산
  const subRevenue = [
    {period:"2025-02",planName:"본사 커스텀",hqCount:hqCustomCount,revenue:30000000*hqCustomCount,refund:0},
    {period:"2025-02",planName:"AI 포함 솔루션",hqCount:3,revenue:30000*3,refund:0},
    {period:"2025-02",planName:"일반 솔루션",hqCount:5,revenue:15000*5,refund:0},
  ];

  return (
    <div>
      {/* KPI */}
      <div style={{display:"flex",gap:14,marginBottom:18,flexWrap:"wrap"}}>
        <KPICard label="플랫폼 MRR" value={`₩${fmt(totalMRR)}`} sub="구독 반복 매출 (2025-02)" icon="dollar" color={C.green} trend="+2.4% MoM"/>
        <KPICard label="본사 커스텀 수납" value={`₩${fmt(30000000*hqCustomCount)}`} sub={`${hqCustomCount}개 본사 · 1회성`} icon="building" color={C.purple}/>
        <KPICard label="가맹점 구독" value={`₩${fmt(SUBSCRIPTIONS_DATA.filter(s=>s.planId!=="PLAN-HQ-001"&&s.status==="ACTIVE").reduce((s,x)=>s+x.amount,0))}`} sub={`${SUBSCRIPTIONS_DATA.filter(s=>s.planId!=="PLAN-HQ-001"&&s.status==="ACTIVE").length}개 가맹점`} icon="creditcard" color={C.blue}/>
        <KPICard label="미수금" value="₩30,000" sub="연체 2건 포함" icon="alert" color={C.red} trendBad/>
      </div>
      {/* 차트 + 구성 */}
      <div style={{display:"flex",gap:16,marginBottom:18}}>
        <Card style={{flex:2}}>
          <div style={{fontSize:T.md,fontWeight:700,color:C.text,marginBottom:14}}>월별 MRR 추이</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MRR_TREND} margin={{top:4,right:4,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight}/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:C.textSub}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:C.textSub}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/10000).toFixed(0)}만`}/>
              <Tooltip formatter={v=>[`₩${fmt(v)}`,"MRR"]} contentStyle={{fontSize:12,borderRadius:8,border:`1px solid ${C.border}`}}/>
              <Line type="monotone" dataKey="mrr" stroke={C.blue} strokeWidth={2.5} dot={{fill:C.blue,r:4,strokeWidth:0}}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{flex:1}}>
          <div style={{fontSize:T.md,fontWeight:700,color:C.text,marginBottom:14}}>요금제별 MRR 구성</div>
          {planGroups.map(item=>(
            <div key={item.label} style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:9,height:9,borderRadius:2,background:item.color}}/>
                  <span style={{fontSize:T.sm,fontWeight:700,color:C.text}}>{item.label}</span>
                  <span style={{fontSize:T.xs,color:C.textMuted}}>{item.count}개</span>
                </div>
                <span style={{fontSize:T.sm,fontWeight:800,color:C.text}}>₩{fmt(item.mrr)}</span>
              </div>
              <div style={{height:7,borderRadius:4,background:C.borderLight}}>
                <div style={{height:"100%",borderRadius:4,background:item.color,width:`${Math.round(item.mrr/totalMRR*100)}%`,transition:"width .7s"}}/>
              </div>
            </div>
          ))}
        </Card>
      </div>
      {/* 구독별 매출 상세 */}
      <Card>
        <div style={{fontSize:T.md,fontWeight:700,color:C.text,marginBottom:14}}>구독별 매출 상세 (BC-SALES-001)</div>
        <Table cols={["기간","요금제","구독 수","매출(VAT제외)","환불","순매출"]} rows={subRevenue}
          renderRow={row=><>
            <Td style={{fontFamily:"monospace",fontSize:T.xs,color:C.blue}}>{row.period}</Td>
            <Td style={{fontWeight:600}}>{row.planName}</Td>
            <Td style={{color:C.textSub}}>{row.hqCount}건</Td>
            <Td style={{fontWeight:700}}>₩{fmt(row.revenue)}</Td>
            <Td style={{color:row.refund?C.red:C.textMuted}}>{row.refund?`-₩${fmt(row.refund)}`:"—"}</Td>
            <Td style={{fontWeight:800,color:C.green}}>₩{fmt(row.revenue-row.refund)}</Td>
          </>}
        />
      </Card>
    </div>
  );
};

// ── BillingPage 메인 ──────────────────────────────────────────────────────────
const BillingPage = () => {
  const [tab, setTab] = useState("revenue");
  const overdueCount = INVOICES_DATA.filter(i=>i.status==="OVERDUE").length;
  const TABS = [
    {k:"revenue",      l:"매출 개요"},
    {k:"subscriptions",l:"구독 관리"},
    {k:"invoices",     l:`청구 내역${overdueCount>0?` (연체 ${overdueCount})`:""}`  , badge:overdueCount>0},
    {k:"rateplans",    l:"요금제 관리"},
  ];
  return (
    <div>
      <SectionHeader title="구독·과금 관리" sub="요금제·구독·청구 통합 관리"/>
      <div style={{display:"flex",gap:0,borderBottom:`2px solid ${C.border}`,marginBottom:22}}>
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)}
            style={{padding:"9px 22px",border:"none",background:"none",cursor:"pointer",fontSize:T.sm,fontWeight:tab===t.k?700:500,color:tab===t.k?C.blue:C.textSub,borderBottom:tab===t.k?`2px solid ${C.blue}`:"2px solid transparent",marginBottom:"-2px",transition:"all .15s",position:"relative"}}>
            {t.l}
            {t.badge && <span style={{position:"absolute",top:8,right:4,width:7,height:7,borderRadius:"50%",background:C.red}}/>}
          </button>
        ))}
      </div>
      {tab==="revenue"       && <RevenueOverviewTab/>}
      {tab==="subscriptions" && <SubscriptionTab/>}
      {tab==="invoices"      && <InvoiceTab/>}
      {tab==="rateplans"     && <RatePlanTab/>}
    </div>
  );
};
// ─── SYSTEM MONITORING ───────────────────────────────────────────────────────
const SystemPage = () => (
  <div>
    <SectionHeader title="시스템 모니터링" sub="API·연동 서비스 상태 및 서버 리소스"
      action={<BtnGhost><Icon name="refresh" size={14} color={C.textSub}/>새로고침</BtnGhost>}/>
    <div style={{display:"flex",gap:14,marginBottom:18,flexWrap:"wrap"}}>
      <KPICard label="서비스 상태" value="5 / 6 정상" sub="배달 앱 연동 경고" icon="monitor" color={C.orange}/>
      <KPICard label="평균 응답시간" value="348ms" sub="API 전체 기준" icon="trending" color={C.blue}/>
      <KPICard label="평균 에러율" value="0.25%" sub="목표치 1% 미만" icon="alert" color={C.green} trend="양호"/>
      <KPICard label="플랫폼 가동률" value="99.93%" sub="이번달 기준" icon="check" color={C.green}/>
    </div>
    <Card style={{marginBottom:16}}>
      <div style={{fontSize:T.md,fontWeight:700,color:C.text,marginBottom:14}}>서비스·연동 상태</div>
      <Table cols={["서비스","상태","응답시간","업타임","에러율"]} rows={SYSTEM_STATUS}
        renderRow={row=><>
          <Td style={{fontWeight:700}}>{row.name}</Td>
          <Td><StatusDot status={row.status}/></Td>
          <Td style={{fontFamily:"monospace",fontWeight:600,color:parseFloat(row.responseTime)>500?C.orange:C.text}}>{row.responseTime}</Td>
          <Td style={{color:C.green,fontWeight:700}}>{row.uptime}</Td>
          <Td style={{color:parseFloat(row.errorRate)>1?C.red:C.textSub,fontWeight:parseFloat(row.errorRate)>1?700:400}}>{row.errorRate}</Td>
        </>}
      />
    </Card>
    <Card>
      <div style={{fontSize:T.md,fontWeight:700,color:C.text,marginBottom:14}}>서버 리소스 현황</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        {[{label:"CPU",value:42,color:C.blue},{label:"Memory",value:67,color:C.purple},{label:"Disk",value:55,color:C.orange}].map(item=>(
          <div key={item.label} style={{padding:"16px 18px",background:C.bg,borderRadius:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:12}}>
              <span style={{fontSize:T.sm,color:C.textSub,fontWeight:500}}>{item.label}</span>
              <span style={{fontSize:T["2xl"],fontWeight:800,color:item.value>80?C.red:C.text}}>{item.value}%</span>
            </div>
            <div style={{height:10,borderRadius:5,background:C.border}}>
              <div style={{height:"100%",borderRadius:5,background:item.value>80?C.red:item.color,width:`${item.value}%`,transition:"width 0.8s"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:7,fontSize:T.xs,color:C.textMuted}}>
              <span>사용 중</span><span>잔여 {100-item.value}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

// ─── NOTICES ─────────────────────────────────────────────────────────────────
const NoticePage = () => {
  const [creating,setCreating] = useState(false);
  return (
    <div>
      <SectionHeader title="공지·릴리즈 관리" sub="전체/특정 고객사 공지 및 앱 업데이트 관리"
        action={<BtnPrimary onClick={()=>setCreating(v=>!v)}><Icon name="plus" size={14} color={C.white}/>공지 작성</BtnPrimary>}/>
      {creating&&(
        <Card style={{marginBottom:16,border:`1.5px solid ${C.blue}44`}}>
          <div style={{fontSize:T.md,fontWeight:700,color:C.text,marginBottom:14}}>새 공지 작성</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <input placeholder="공지 제목을 입력하세요" style={{padding:"10px 14px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:T.md,outline:"none"}}/>
            <div style={{display:"flex",gap:10}}>
              <select style={{padding:"10px 14px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:T.md,flex:1,outline:"none"}}>
                <option>전체 고객사</option>
                {HQ_LIST.map(h=><option key={h.id}>{h.name}</option>)}
              </select>
              <select style={{padding:"10px 14px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:T.md,flex:1,outline:"none"}}>
                <option>일반 공지</option><option>릴리즈 노트</option><option>점검 공지</option>
              </select>
            </div>
            <textarea rows={4} placeholder="공지 내용을 입력하세요" style={{padding:"10px 14px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:T.md,resize:"vertical",outline:"none"}}/>
            <div style={{display:"flex",gap:8}}>
              <BtnPrimary>즉시 배포</BtnPrimary>
              <BtnGhost>예약 발송</BtnGhost>
              <BtnGhost onClick={()=>setCreating(false)}>취소</BtnGhost>
            </div>
          </div>
        </Card>
      )}
      <Card>
        <Table cols={["제목","대상","상태","작성일","액션"]} rows={NOTICES}
          renderRow={row=><>
            <Td style={{fontWeight:600}}>{row.title}</Td>
            <Td><Badge label={row.target} color={row.target==="전체"?C.blue:C.purple} bg={row.target==="전체"?C.blueSoft:C.purpleSoft}/></Td>
            <Td><StatusDot status={row.status}/></Td>
            <Td style={{color:C.textSub}}>{row.date}</Td>
            <Td><BtnGhost style={{padding:"4px 10px",fontSize:T.xs}}><Icon name="eye" size={12} color={C.textSub}/>보기</BtnGhost></Td>
          </>}
        />
      </Card>
    </div>
  );
};

// ─── ACCOUNTS ────────────────────────────────────────────────────────────────
const AccountPage = () => (
  <div>
    <SectionHeader title="계정 관리" sub="브릿지코드 내부 운영·기술·세일즈 팀 계정"
      action={<BtnPrimary><Icon name="plus" size={14} color={C.white}/>계정 추가</BtnPrimary>}/>
    <div style={{display:"flex",gap:14,marginBottom:18,flexWrap:"wrap"}}>
      {[["운영팀",3,C.blue],["세일즈팀",1,C.green],["기술팀",2,C.purple]].map(([label,cnt,color])=>(
        <Card key={label} style={{flex:1}}>
          <div style={{fontSize:T.sm,color:C.textSub,fontWeight:500,marginBottom:6}}>{label}</div>
          <div style={{fontSize:T["2xl"],fontWeight:800,color}}>{cnt}명</div>
        </Card>
      ))}
      <Card style={{flex:2}}>
        <div style={{fontSize:T.sm,color:C.textSub,fontWeight:500,marginBottom:6}}>전체 계정</div>
        <div style={{display:"flex",alignItems:"baseline",gap:6}}>
          <div style={{fontSize:T["2xl"],fontWeight:800,color:C.text}}>{ACCOUNTS.filter(a=>a.status==="활성").length}명</div>
          <div style={{fontSize:T.sm,color:C.textMuted}}>활성 / 전체 {ACCOUNTS.length}명</div>
        </div>
      </Card>
    </div>
    <Card>
      <Table cols={["이름","이메일","팀","역할","상태","마지막 로그인"]} rows={ACCOUNTS}
        renderRow={row=>{
          const teamColor = row.role==="기술팀"?C.purple:row.role==="세일즈팀"?C.green:C.blue;
          const teamBg    = row.role==="기술팀"?C.purpleSoft:row.role==="세일즈팀"?C.greenSoft:C.blueSoft;
          return <>
            <Td style={{fontWeight:700}}>{row.name}</Td>
            <Td style={{color:C.textSub,fontSize:T.sm}}>{row.email}</Td>
            <Td><Badge label={row.team} color={teamColor} bg={teamBg}/></Td>
            <Td style={{color:C.textSub}}>{row.role}</Td>
            <Td><StatusDot status={row.status}/></Td>
            <Td style={{color:C.textMuted,fontSize:T.sm}}>{row.lastLogin}</Td>
          </>;
        }}
      />
    </Card>
  </div>
);

// ─── SETTINGS ────────────────────────────────────────────────────────────────
const SettingsPage = () => (
  <div>
    <SectionHeader title="설정" sub="구독 플랜 정책 및 AI 한도 시스템 설정"/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <Card>
        <div style={{fontSize:T.md,fontWeight:700,color:C.text,marginBottom:16}}>구독 플랜 정책</div>
        {[
          {plan:"Basic",price:"가맹점당 ₩15,000/월",features:["기본 운영 관리","POS 연동","배달앱 연동","AI 코칭 미포함"],color:C.textSub},
          {plan:"Special",price:"가맹점당 ₩30,000/월",features:["Basic 포함","AI 코칭 포함","월 2,000회 AI 한도","우선 CS 지원"],color:C.blue},
          {plan:"Enterprise",price:"별도 계약",features:["Special 포함","커스텀 AI 한도","전담 AM 배정","커스텀 기능 개발"],color:C.purple},
        ].map(item=>(
          <div key={item.plan} style={{padding:"14px 16px",borderRadius:10,border:`1.5px solid ${item.color}30`,background:item.color+"09",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontWeight:800,color:item.color,fontSize:T.md}}>{item.plan}</span>
              <span style={{fontSize:T.sm,fontWeight:700,color:C.text}}>{item.price}</span>
            </div>
            {item.features.map(f=>(
              <div key={f} style={{display:"flex",alignItems:"center",gap:6,fontSize:T.sm,color:C.textSub,marginBottom:4}}>
                <Icon name="check" size={13} color={item.color}/>{f}
              </div>
            ))}
          </div>
        ))}
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Card>
          <div style={{fontSize:T.md,fontWeight:700,color:C.text,marginBottom:14}}>AI 월 한도 설정</div>
          {[{plan:"Basic",limit:"미포함",color:C.textMuted},{plan:"Special",limit:"2,000회/월",color:C.blue},{plan:"Enterprise",limit:"커스텀 설정",color:C.purple}].map(item=>(
            <div key={item.plan} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:C.bg,borderRadius:8,marginBottom:8}}>
              <span style={{fontSize:T.sm,fontWeight:700,color:C.text}}>{item.plan}</span>
              <span style={{fontSize:T.sm,fontWeight:700,color:item.color}}>{item.limit}</span>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{fontSize:T.md,fontWeight:700,color:C.text,marginBottom:14}}>AI 제공사 연동</div>
          <div style={{padding:"16px 18px",background:C.blueSoft,borderRadius:10,display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:40,height:40,borderRadius:10,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Icon name="cpu" size={20} color={C.white}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:T.md,fontWeight:800,color:C.text}}>Anthropic Claude API</div>
              <div style={{fontSize:T.xs,color:C.textSub,marginTop:2}}>claude-3-5-haiku-20241022 · claude-3-5-sonnet-20241022</div>
            </div>
            <StatusDot status="정상"/>
          </div>
        </Card>
        <Card>
          <div style={{fontSize:T.md,fontWeight:700,color:C.text,marginBottom:14}}>알림 설정</div>
          {[["미납 발생 시 즉시 알림","on"],["AI 한도 80% 도달 시 경고","on"],["시스템 에러율 1% 초과 시 알림","on"],["계약 만료 30일 전 알림","off"]].map(([label,val])=>(
            <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.borderLight}`}}>
              <span style={{fontSize:T.sm,color:C.text}}>{label}</span>
              <div style={{width:40,height:22,borderRadius:11,background:val==="on"?C.blue:C.border,cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
                <div style={{position:"absolute",top:3,left:val==="on"?20:3,width:16,height:16,borderRadius:"50%",background:C.white,transition:"left 0.2s"}}/>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  </div>
);

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const MENU = [
  {key:"dashboard",label:"대시보드",icon:"dashboard"},
  {key:"hq",label:"고객사(HQ) 관리",icon:"building"},
  {key:"billing",label:"구독·과금 관리",icon:"creditcard"},
  {key:"system",label:"시스템 모니터링",icon:"monitor"},
  {key:"notice",label:"공지·릴리즈 관리",icon:"bell"},
  {key:"accounts",label:"계정 관리",icon:"users"},
  {key:"settings",label:"설정",icon:"settings"},
];
const BADGES = {billing:"1",system:"!"};

const Sidebar = ({active, setActive, collapsed, mobile, open, onClose}) => {
  const w = collapsed ? 68 : 232;

  // 모바일 오버레이 클릭 시 닫기
  const handleNav = (key) => { setActive(key); if (mobile) onClose(); };

  return (<>
    {/* 모바일 오버레이 배경 */}
    {mobile && open && (
      <div onClick={onClose}
        style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:99,transition:"opacity .2s"}}/>
    )}

    <div style={{
      width:w, minHeight:"100vh", background:C.sidebar,
      display:"flex", flexDirection:"column",
      position:"fixed", top:0, left:0, bottom:0, zIndex:100,
      transform: mobile ? (open ? "translateX(0)" : "translateX(-100%)") : "translateX(0)",
      transition:"transform .25s cubic-bezier(.4,0,.2,1), width .2s ease",
      overflowX:"hidden",
    }}>
      {/* 로고 헤더 */}
      <div style={{padding: collapsed?"16px 0":"22px 18px 18px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent: collapsed?"center":"flex-start", gap:10}}>
        <div style={{width:36,height:36,borderRadius:9,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Icon name="grid" size={18} color={C.white}/>
        </div>
        {!collapsed && (
          <div>
            <div style={{fontSize:T.lg,fontWeight:900,color:C.white,letterSpacing:"-0.4px"}}>Selviser</div>
            <div style={{fontSize:T.xs,color:"rgba(255,255,255,0.35)",marginTop:1,letterSpacing:"0.2px"}}>BC Admin Console</div>
          </div>
        )}
      </div>

      {/* 네비게이션 */}
      <nav style={{flex:1, padding: collapsed?"10px 6px":"10px 10px"}}>
        {!collapsed && (
          <div style={{fontSize:"10px",color:"rgba(255,255,255,0.25)",fontWeight:700,padding:"8px 10px 4px",letterSpacing:"0.8px"}}>NAVIGATION</div>
        )}
        {MENU.map(item=>{
          const isActive = active === item.key;
          const badge    = BADGES[item.key];
          return (
            <button key={item.key} onClick={()=>handleNav(item.key)}
              title={collapsed ? item.label : ""}
              style={{
                width:"100%", display:"flex", alignItems:"center",
                gap: collapsed ? 0 : 9,
                padding: collapsed ? "10px 0" : "9px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius:8, border:"none", cursor:"pointer",
                background: isActive ? C.sidebarActive : "transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                fontSize:T.sm, fontWeight: isActive ? 700 : 400,
                marginBottom:1, transition:"all 0.15s", textAlign:"left",
                position:"relative",
              }}
              onMouseEnter={e=>{if(!isActive){e.currentTarget.style.background=C.sidebarHover;e.currentTarget.style.color="rgba(255,255,255,0.85)";}}}
              onMouseLeave={e=>{if(!isActive){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.5)";}}}
            >
              <Icon name={item.icon} size={17} color={isActive?"#fff":"rgba(255,255,255,0.5)"}/>
              {!collapsed && <span style={{flex:1}}>{item.label}</span>}
              {!collapsed && badge && (
                <span style={{fontSize:"10px",background:badge==="!"?C.orange:C.red,color:"#fff",padding:"1px 6px",borderRadius:99,fontWeight:800}}>{badge}</span>
              )}
              {collapsed && badge && (
                <span style={{position:"absolute",top:6,right:10,width:7,height:7,borderRadius:"50%",background:badge==="!"?C.orange:C.red}}/>
              )}
            </button>
          );
        })}
      </nav>

      {/* 하단 프로필 */}
      <div style={{padding: collapsed?"10px 6px 14px":"12px 14px 16px", borderTop:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap: collapsed?0:9, justifyContent: collapsed?"center":"flex-start"}}>
          <div style={{width:32,height:32,borderRadius:8,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:T.sm,fontWeight:800,color:"#fff",flexShrink:0}}>관</div>
          {!collapsed && (<>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:T.sm,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>슈퍼 관리자</div>
              <div style={{fontSize:T.xs,color:"rgba(255,255,255,0.3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>admin@bridgecode.kr</div>
            </div>
            <button style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",padding:4,flexShrink:0}}>
              <Icon name="logout" size={15} color="rgba(255,255,255,0.3)"/>
            </button>
          </>)}
        </div>
      </div>
    </div>
  </>);
};

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
const Topbar = ({page, user, onLogout, mobile, onMenuOpen}) => {
  const menu = MENU.find(m=>m.key===page);
  return (
    <div style={{height:54,background:C.white,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 20px 0 16px",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {/* 햄버거 (모바일) */}
        {mobile && (
          <button onClick={onMenuOpen}
            style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,color:C.text,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <line x1="3" y1="6"  x2="21" y2="6"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
        <span style={{fontSize:T.xs,color:C.textMuted,fontWeight:500}}>BridgeCode</span>
        <Icon name="chevronRight" size={12} color={C.textMuted}/>
        <span style={{fontSize:T.sm,fontWeight:700,color:C.text}}>{menu?.label}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:mobile?8:14}}>
        {!mobile && <span style={{fontSize:T.sm,color:C.textMuted}}>2025년 2월 14일 (금)</span>}
        {!mobile && <div style={{width:1,height:14,background:C.border}}/>}
        {!mobile && (
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:C.green}}/>
            <span style={{fontSize:T.xs,color:C.textSub,fontWeight:500}}>시스템 정상</span>
          </div>
        )}
        <button style={{position:"relative",background:"none",border:"none",cursor:"pointer",padding:4,color:C.textSub}}>
          <Icon name="bell" size={17} color={C.textSub}/>
          <span style={{position:"absolute",top:2,right:2,width:7,height:7,borderRadius:"50%",background:C.red,border:`1.5px solid ${C.white}`}}/>
        </button>
        {user && (<>
          <div style={{width:1,height:14,background:C.border}}/>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.blue},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:"11px",fontWeight:700,color:"#fff"}}>{user.name?.[0]||"A"}</span>
            </div>
            {!mobile && (
              <div>
                <div style={{fontSize:T.xs,fontWeight:700,color:C.text}}>{user.name}</div>
                <div style={{fontSize:"10px",color:C.textMuted}}>{user.role}</div>
              </div>
            )}
          </div>
          <button onClick={onLogout}
            style={{padding:"5px 11px",borderRadius:7,border:`1px solid ${C.border}`,background:C.bg,color:C.textSub,fontSize:T.xs,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {!mobile && "로그아웃"}
          </button>
        </>)}
      </div>
    </div>
  );
};


// ─── 로그인 MOCK 계정 ────────────────────────────────────────────────────────
const TEMP_PASSWORD = "!Q2w3e4r5t";   // 초기 임시 비밀번호 (최초 로그인 시 변경 필수)
const MOCK_ACCOUNTS = [
  { id:"admin@bridgecode.co.kr",  password:TEMP_PASSWORD, name:"김민준", role:"운영팀장", verified:false },
  { id:"sales@bridgecode.co.kr",  password:TEMP_PASSWORD, name:"이수진", role:"세일즈",   verified:false },
  { id:"dev@bridgecode.co.kr",    password:TEMP_PASSWORD, name:"박도현", role:"기술팀",   verified:false },
];

// ─── 로그인 화면 ──────────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin }) => {
  const [step, setStep]         = useState("login");   // login | verify | pw_change | reset_req | reset_sent
  const [id, setId]             = useState("");
  const [pass, setPass]         = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);

  // 이메일 인증 OTP
  const [otp, setOtp]           = useState(["","","","","",""]);
  const [otpError, setOtpError] = useState("");
  const [timer, setTimer]       = useState(180);
  const [expired, setExpired]   = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const inputRefs = useRef([]);

  // 비밀번호 변경 폼
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwErrors,  setPwErrors]  = useState({});

  // 타이머
  useEffect(() => {
    if (step !== "verify") return;
    setTimer(180); setExpired(false);
    const t = setInterval(() => {
      setTimer(p => { if (p <= 1) { clearInterval(t); setExpired(true); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  const fmtTimer = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  // 로그인 처리
  const handleLogin = () => {
    const errs = {};
    if (!id.trim())   errs.id   = "아이디(이메일)를 입력하세요.";
    if (!pass.trim()) errs.pass = "비밀번호를 입력하세요.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const user = MOCK_ACCOUNTS.find(a => a.id === id && a.password === pass);
      if (!user) { setErrors({ global: "아이디 또는 비밀번호가 올바르지 않습니다." }); return; }
      setCurrentUser(user);
      setStep("verify");
    }, 900);
  };

  // OTP 입력
  const handleOtpChange = (idx, val) => {
    const clean = val.replace(/\D/g, "").slice(-1);
    const next  = [...otp]; next[idx] = clean;
    setOtp(next); setOtpError("");
    if (clean && idx < 5) inputRefs.current[idx+1]?.focus();
    if (!clean && idx > 0) inputRefs.current[idx-1]?.focus();
  };
  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) inputRefs.current[idx-1]?.focus();
    if (e.key === "ArrowLeft"  && idx > 0) inputRefs.current[idx-1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputRefs.current[idx+1]?.focus();
  };
  const handleOtpPaste = e => {
    const paste = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (paste.length === 6) {
      setOtp(paste.split(""));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  // OTP 확인 (mock: 123456)
  const handleVerify = () => {
    if (expired) { setOtpError("인증 시간이 만료되었습니다. 재발송해 주세요."); return; }
    const code = otp.join("");
    if (code.length < 6) { setOtpError("인증번호 6자리를 모두 입력하세요."); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (code === "123456") {
        // 최초 로그인 → 비밀번호 변경 화면으로 이동
        setStep("pw_change");
        setNewPw(""); setConfirmPw(""); setPwErrors({});
      } else {
        setOtpError("인증번호가 올바르지 않습니다. 다시 확인해 주세요.");
        setOtp(["","","","","",""]);
        inputRefs.current[0]?.focus();
      }
    }, 700);
  };

  // 비밀번호 변경 처리
  const PW_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/;
  const handlePwChange = () => {
    const errs = {};
    if (!newPw)                                 errs.newPw     = "새 비밀번호를 입력하세요.";
    else if (newPw === TEMP_PASSWORD)           errs.newPw     = "임시 비밀번호와 다른 비밀번호를 사용하세요.";
    else if (!PW_REGEX.test(newPw))            errs.newPw     = "영문 대/소문자, 숫자, 특수문자 포함 8~20자";
    if (!confirmPw)                             errs.confirmPw = "비밀번호 확인을 입력하세요.";
    else if (newPw !== confirmPw)               errs.confirmPw = "비밀번호가 일치하지 않습니다.";
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({ ...currentUser, verified: true });
    }, 700);
  };

  const handleResend = () => {
    setOtp(["","","","","",""]); setOtpError("");
    setTimer(180); setExpired(false);
    inputRefs.current[0]?.focus();
  };

  // 마스킹된 이메일
  const maskEmail = email => {
    const [local, domain] = email.split("@");
    return local.slice(0, 3) + "***@" + domain;
  };

  // ── 공통 스타일 ────────────────────────────────────────────────────────────
  const fieldStyle = (key) => ({
    width:"100%", padding:"12px 14px", fontSize:"14px", outline:"none",
    border:`1.5px solid ${errors[key] ? C.red : C.border}`,
    borderRadius:10, color:C.text, background:C.white, boxSizing:"border-box",
    transition:"border-color .2s",
  });

  // ── 배경 레이아웃 ─────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:`linear-gradient(135deg, #0F1B2D 0%, #1B2D45 50%, #0F1B2D 100%)`,
      fontFamily:"'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif",
      position:"relative", overflow:"hidden",
    }}>
      {/* 배경 장식 */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
        <div style={{position:"absolute",top:-120,left:-120,width:400,height:400,borderRadius:"50%",background:"rgba(27,100,218,0.08)"}}/>
        <div style={{position:"absolute",bottom:-80,right:-80,width:320,height:320,borderRadius:"50%",background:"rgba(123,92,240,0.06)"}}/>
        <div style={{position:"absolute",top:"40%",right:"8%",width:180,height:180,borderRadius:"50%",background:"rgba(27,100,218,0.04)"}}/>
      </div>

      {/* 카드 */}
      <div style={{
        width:420, background:C.white, borderRadius:20,
        boxShadow:"0 32px 80px rgba(0,0,0,0.35)", position:"relative", zIndex:1,
        overflow:"hidden",
      }}>
        {/* 상단 헤더 바 */}
        <div style={{height:5, background:`linear-gradient(90deg, ${C.blue}, ${C.purple})`}}/>

        <div style={{padding:"40px 40px 36px"}}>
          {/* 로고 */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:32}}>
            <div style={{
              width:42, height:42, borderRadius:12,
              background:`linear-gradient(135deg, ${C.blue}, ${C.purple})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:`0 4px 14px ${C.blue}55`,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="2" fill="white" opacity=".9"/>
                <rect x="13" y="3" width="8" height="8" rx="2" fill="white" opacity=".6"/>
                <rect x="3" y="13" width="8" height="8" rx="2" fill="white" opacity=".6"/>
                <rect x="13" y="13" width="8" height="8" rx="2" fill="white" opacity=".9"/>
              </svg>
            </div>
            <div>
              <div style={{fontSize:"17px",fontWeight:800,color:C.text,letterSpacing:"-0.3px"}}>BridgeCode Admin</div>
              <div style={{fontSize:"11px",color:C.textMuted,marginTop:1}}>BC Admin Console</div>
            </div>
          </div>

          {/* ──────── STEP: 로그인 ──────── */}
          {step === "login" && (<>
            <div style={{marginBottom:28}}>
              <div style={{fontSize:"22px",fontWeight:800,color:C.text,marginBottom:5}}>로그인</div>
              <div style={{fontSize:"13px",color:C.textSub}}>관리자 계정으로 로그인하세요.</div>
            </div>

            {errors.global && (
              <div style={{
                padding:"11px 14px", borderRadius:9, background:C.redSoft,
                border:`1px solid ${C.red}44`, fontSize:"13px", color:C.red,
                marginBottom:18, display:"flex", alignItems:"center", gap:8,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke={C.red} strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke={C.red} strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {errors.global}
              </div>
            )}

            <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
              <div>
                <div style={{fontSize:"12px",fontWeight:600,color:C.textSub,marginBottom:6}}>아이디 (이메일)</div>
                <input
                  value={id} onChange={e=>{setId(e.target.value);setErrors(p=>({...p,id:null,global:null}));}}
                  onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                  placeholder="example@bridgecode.co.kr"
                  style={fieldStyle("id")}
                  autoComplete="username"
                />
                {errors.id && <div style={{fontSize:"11px",color:C.red,marginTop:4}}>{errors.id}</div>}
              </div>
              <div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:"12px",fontWeight:600,color:C.textSub}}>비밀번호</span>
                  <button onClick={()=>setStep("reset_req")}
                    style={{fontSize:"11px",color:C.blue,background:"none",border:"none",cursor:"pointer",padding:0,fontWeight:500}}>
                    비밀번호 찾기
                  </button>
                </div>
                <div style={{position:"relative"}}>
                  <input
                    type={showPass?"text":"password"}
                    value={pass} onChange={e=>{setPass(e.target.value);setErrors(p=>({...p,pass:null,global:null}));}}
                    onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                    placeholder="비밀번호를 입력하세요"
                    style={{...fieldStyle("pass"), paddingRight:44}}
                    autoComplete="current-password"
                  />
                  <button onClick={()=>setShowPass(p=>!p)}
                    style={{position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.textMuted,padding:0}}>
                    {showPass
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                    }
                  </button>
                </div>
                {errors.pass && <div style={{fontSize:"11px",color:C.red,marginTop:4}}>{errors.pass}</div>}
              </div>
            </div>

            <button onClick={handleLogin} disabled={loading}
              style={{
                width:"100%", padding:"13px", borderRadius:10, border:"none",
                background: loading ? C.border : `linear-gradient(135deg, ${C.blue}, ${C.blueHover})`,
                color: loading ? C.textMuted : "#fff",
                fontSize:"14px", fontWeight:700, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : `0 4px 14px ${C.blue}44`,
                transition:"all .2s", letterSpacing:"0.2px",
              }}>
              {loading ? "확인 중..." : "로그인"}
            </button>

            <div style={{marginTop:20,padding:"13px 16px",background:C.bg,borderRadius:10,border:`1px solid ${C.borderLight}`}}>
              <div style={{fontSize:"11px",fontWeight:700,color:C.textMuted,marginBottom:8}}>테스트 계정</div>
              {MOCK_ACCOUNTS.map(a=>(
                <div key={a.id} onClick={()=>{setId(a.id);setPass(a.password);setErrors({});}}
                  style={{padding:"7px 0",cursor:"pointer",borderBottom:`1px solid ${C.borderLight}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                    <span style={{fontSize:"11px",fontWeight:600,color:C.textSub}}>{a.id}</span>
                    <span style={{fontSize:"10px",padding:"2px 6px",borderRadius:4,background:C.orangeSoft,color:C.orange,fontWeight:600}}>최초 로그인</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{fontSize:"10px",color:C.textMuted}}>비밀번호</span>
                    <span style={{fontFamily:"monospace",fontSize:"11px",fontWeight:700,color:C.text,background:C.white,padding:"1px 7px",borderRadius:4,border:`1px solid ${C.border}`,letterSpacing:"1px"}}>{a.password}</span>
                  </div>
                </div>
              ))}
              <div style={{fontSize:"10px",color:C.textMuted,marginTop:7,lineHeight:1.6}}>
                클릭 시 자동 입력 · 최초 로그인 후 비밀번호 변경 필수
              </div>
            </div>
          </>)}

          {/* ──────── STEP: 이메일 인증 ──────── */}
          {step === "verify" && (<>
            <div style={{marginBottom:28}}>
              <button onClick={()=>setStep("login")}
                style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",color:C.textSub,fontSize:"12px",padding:0,marginBottom:16,fontWeight:500}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                로그인으로 돌아가기
              </button>
              <div style={{
                width:52, height:52, borderRadius:14, background:C.blueSoft,
                display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16,
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="16" rx="3" stroke={C.blue} strokeWidth="2"/>
                  <path d="M2 7l10 7 10-7" stroke={C.blue} strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{fontSize:"20px",fontWeight:800,color:C.text,marginBottom:6}}>이메일 인증</div>
              <div style={{fontSize:"13px",color:C.textSub,lineHeight:1.6}}>
                <b style={{color:C.text}}>{currentUser && maskEmail(currentUser.id)}</b>으로<br/>
                인증번호 6자리를 발송했습니다.<br/>
                <span style={{fontSize:"12px",color:C.textMuted}}>최초 로그인 시 1회 인증이 필요합니다.</span>
              </div>
            </div>

            {/* OTP 입력 */}
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:10}}>
                {otp.map((v,i)=>(
                  <input
                    key={i} ref={el=>inputRefs.current[i]=el}
                    value={v} maxLength={1} inputMode="numeric"
                    onChange={e=>handleOtpChange(i,e.target.value)}
                    onKeyDown={e=>handleOtpKeyDown(i,e)}
                    onPaste={handleOtpPaste}
                    style={{
                      width:48, height:56, textAlign:"center",
                      fontSize:"22px", fontWeight:700, color:C.text,
                      border:`2px solid ${otpError?C.red:v?C.blue:C.border}`,
                      borderRadius:12, outline:"none",
                      background: v ? C.blueSoft : C.white,
                      transition:"all .15s",
                    }}
                  />
                ))}
              </div>

              {/* 타이머 */}
              <div style={{textAlign:"center",marginBottom:8}}>
                {expired
                  ? <span style={{fontSize:"13px",color:C.red,fontWeight:600}}>인증 시간이 만료되었습니다.</span>
                  : <span style={{fontSize:"13px",color:timer<=30?C.red:C.textSub}}>
                      남은 시간 <b style={{color:timer<=30?C.red:C.blue,fontFamily:"monospace"}}>{fmtTimer(timer)}</b>
                    </span>
                }
              </div>

              {otpError && (
                <div style={{
                  padding:"10px 14px", borderRadius:9, background:C.redSoft,
                  border:`1px solid ${C.red}44`, fontSize:"12px", color:C.red,
                  textAlign:"center",
                }}>
                  {otpError}
                </div>
              )}
            </div>

            <button onClick={handleVerify} disabled={loading || otp.join("").length < 6}
              style={{
                width:"100%", padding:"13px", borderRadius:10, border:"none",
                background: (loading || otp.join("").length < 6) ? C.border : `linear-gradient(135deg, ${C.blue}, ${C.blueHover})`,
                color: (loading || otp.join("").length < 6) ? C.textMuted : "#fff",
                fontSize:"14px", fontWeight:700,
                cursor: (loading || otp.join("").length < 6) ? "not-allowed" : "pointer",
                boxShadow: (loading || otp.join("").length < 6) ? "none" : `0 4px 14px ${C.blue}44`,
                transition:"all .2s", marginBottom:12,
              }}>
              {loading ? "확인 중..." : "인증 확인"}
            </button>

            <div style={{textAlign:"center",fontSize:"12px",color:C.textSub}}>
              인증번호를 받지 못하셨나요?{" "}
              <button onClick={handleResend}
                style={{background:"none",border:"none",cursor:"pointer",color:C.blue,fontWeight:600,fontSize:"12px",padding:0}}>
                재발송
              </button>
            </div>

            <div style={{marginTop:18,padding:"11px 14px",background:C.orangeSoft,borderRadius:9,border:`1px solid ${C.orange}33`,fontSize:"11px",color:C.orange}}>
              <b>테스트 인증번호:</b> <span style={{fontFamily:"monospace",fontWeight:700,fontSize:"13px"}}>123456</span>
            </div>
          </>)}

          {/* ──────── STEP: 비밀번호 변경 (최초 로그인) ──────── */}
          {step === "pw_change" && (<>
            <div style={{marginBottom:24}}>
              <div style={{
                width:52, height:52, borderRadius:14,
                background:`linear-gradient(135deg, ${C.blue}22, ${C.purple}22)`,
                display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16,
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke={C.blue} strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={C.blue} strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{fontSize:"20px",fontWeight:800,color:C.text,marginBottom:6}}>비밀번호 변경</div>
              <div style={{fontSize:"13px",color:C.textSub,lineHeight:1.6}}>
                최초 로그인입니다. 보안을 위해 <b style={{color:C.text}}>새 비밀번호로 변경</b>해 주세요.<br/>
                <span style={{fontSize:"12px",color:C.textMuted}}>BC Admin · FR Admin 공통 적용 정책입니다.</span>
              </div>
            </div>

            {/* 임시 비밀번호 표시 */}
            <div style={{padding:"10px 14px",background:C.bg,borderRadius:9,marginBottom:18,display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:"12px",color:C.textMuted}}>현재 임시 비밀번호</div>
              <span style={{fontFamily:"monospace",fontWeight:700,fontSize:"13px",color:C.textSub,letterSpacing:"1.5px"}}>{TEMP_PASSWORD}</span>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
              {/* 새 비밀번호 */}
              <div>
                <div style={{fontSize:"12px",fontWeight:600,color:C.textSub,marginBottom:6}}>새 비밀번호 *</div>
                <div style={{position:"relative"}}>
                  <input
                    type={showNewPw?"text":"password"}
                    value={newPw} onChange={e=>{setNewPw(e.target.value);setPwErrors(p=>({...p,newPw:null}));}}
                    placeholder="새 비밀번호 입력"
                    style={{
                      width:"100%", padding:"12px 44px 12px 14px", fontSize:"14px",
                      border:`1.5px solid ${pwErrors.newPw?C.red:C.border}`,
                      borderRadius:10, outline:"none", boxSizing:"border-box", color:C.text,
                    }}
                  />
                  <button onClick={()=>setShowNewPw(p=>!p)}
                    style={{position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.textMuted,padding:0}}>
                    {showNewPw
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                    }
                  </button>
                </div>
                {pwErrors.newPw
                  ? <div style={{fontSize:"11px",color:C.red,marginTop:4}}>{pwErrors.newPw}</div>
                  : <div style={{fontSize:"11px",color:C.textMuted,marginTop:4}}>영문 대/소문자 + 숫자 + 특수문자(!@#$%^&*) 포함 8~20자</div>
                }
              </div>
              {/* 비밀번호 확인 */}
              <div>
                <div style={{fontSize:"12px",fontWeight:600,color:C.textSub,marginBottom:6}}>비밀번호 확인 *</div>
                <input
                  type="password"
                  value={confirmPw} onChange={e=>{setConfirmPw(e.target.value);setPwErrors(p=>({...p,confirmPw:null}));}}
                  placeholder="새 비밀번호 재입력"
                  style={{
                    width:"100%", padding:"12px 14px", fontSize:"14px",
                    border:`1.5px solid ${pwErrors.confirmPw?C.red:confirmPw&&confirmPw===newPw?C.green:C.border}`,
                    borderRadius:10, outline:"none", boxSizing:"border-box", color:C.text,
                  }}
                />
                {pwErrors.confirmPw
                  ? <div style={{fontSize:"11px",color:C.red,marginTop:4}}>{pwErrors.confirmPw}</div>
                  : confirmPw && confirmPw===newPw
                    ? <div style={{fontSize:"11px",color:C.green,marginTop:4}}>✓ 비밀번호가 일치합니다.</div>
                    : null
                }
              </div>
            </div>

            <button onClick={handlePwChange} disabled={loading}
              style={{
                width:"100%", padding:"13px", borderRadius:10, border:"none",
                background: loading ? C.border : `linear-gradient(135deg, ${C.blue}, ${C.blueHover})`,
                color: loading ? C.textMuted : "#fff",
                fontSize:"14px", fontWeight:700, cursor: loading?"not-allowed":"pointer",
                boxShadow: loading?"none":`0 4px 14px ${C.blue}44`, transition:"all .2s",
              }}>
              {loading ? "처리 중..." : "비밀번호 변경 후 입장"}
            </button>
          </>)}

          {/* ──────── STEP: 비밀번호 찾기 요청 ──────── */}
          {step === "reset_req" && (<>
            <div style={{marginBottom:28}}>
              <button onClick={()=>setStep("login")}
                style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",color:C.textSub,fontSize:"12px",padding:0,marginBottom:16,fontWeight:500}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                로그인으로 돌아가기
              </button>
              <div style={{width:52,height:52,borderRadius:14,background:C.orangeSoft,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke={C.orange} strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={C.orange} strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{fontSize:"20px",fontWeight:800,color:C.text,marginBottom:6}}>비밀번호 찾기</div>
              <div style={{fontSize:"13px",color:C.textSub}}>가입한 이메일 주소를 입력하시면<br/>비밀번호 재설정 링크를 보내드립니다.</div>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:"12px",fontWeight:600,color:C.textSub,marginBottom:6}}>등록된 이메일</div>
              <input
                value={id} onChange={e=>setId(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&setStep("reset_sent")}
                placeholder="example@bridgecode.co.kr"
                style={fieldStyle("reset_email")}
              />
            </div>
            <button onClick={()=>setStep("reset_sent")}
              style={{
                width:"100%", padding:"13px", borderRadius:10, border:"none",
                background:`linear-gradient(135deg, ${C.orange}, #E0700F)`,
                color:"#fff", fontSize:"14px", fontWeight:700, cursor:"pointer",
                boxShadow:`0 4px 14px ${C.orange}44`, transition:"all .2s",
              }}>
              재설정 링크 발송
            </button>
          </>)}

          {/* ──────── STEP: 재설정 링크 발송 완료 ──────── */}
          {step === "reset_sent" && (<>
            <div style={{textAlign:"center",padding:"16px 0 8px"}}>
              <div style={{
                width:64,height:64,borderRadius:"50%",background:C.greenSoft,
                display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",
              }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{fontSize:"20px",fontWeight:800,color:C.text,marginBottom:8}}>발송 완료</div>
              <div style={{fontSize:"13px",color:C.textSub,lineHeight:1.7,marginBottom:24}}>
                <b style={{color:C.text}}>{id||"입력한 이메일"}</b>로<br/>
                비밀번호 재설정 링크를 발송했습니다.<br/>
                <span style={{fontSize:"12px",color:C.textMuted}}>메일이 오지 않으면 스팸함을 확인해 주세요.</span>
              </div>
              <button onClick={()=>{setStep("login");setErrors({});}}
                style={{
                  width:"100%",padding:"13px",borderRadius:10,border:`1.5px solid ${C.border}`,
                  background:C.white,color:C.text,fontSize:"14px",fontWeight:600,cursor:"pointer",
                }}>
                로그인으로 돌아가기
              </button>
            </div>
          </>)}

        </div>

        {/* 하단 푸터 */}
        <div style={{
          padding:"14px 40px 20px",borderTop:`1px solid ${C.borderLight}`,
          display:"flex",justifyContent:"space-between",alignItems:"center",
        }}>
          <span style={{fontSize:"11px",color:C.textMuted}}>© 2025 BridgeCode Inc.</span>
          <div style={{display:"flex",gap:14}}>
            {["이용약관","개인정보처리방침","고객지원"].map(t=>(
              <button key={t} style={{fontSize:"11px",color:C.textMuted,background:"none",border:"none",cursor:"pointer",padding:0}}>{t}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── App (인증 게이트 포함) ───────────────────────────────────────────────────
export default function App() {
  const [authUser, setAuthUser]     = useState(null);
  const [page, setPage]             = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { sidebarW, collapsed, mobile, contentPx, contentPy } = useLayout();

  // 페이지 이동 시 모바일 메뉴 닫기
  const handleSetPage = (p) => { setPage(p); setMobileOpen(false); };

  if (!authUser) return <LoginScreen onLogin={u => setAuthUser(u)}/>;

  const pages = {
    dashboard:<Dashboard/>, hq:<HQManagement/>, billing:<BillingPage/>
    ,system:<SystemPage/>, notice:<NoticePage/>, accounts:<AccountPage/>, settings:<SettingsPage/>
  };
  return (
    <div style={{
      display:"flex", minHeight:"100vh", background:C.bg,
      fontFamily:"'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif",
    }}>
      <Sidebar
        active={page} setActive={handleSetPage}
        collapsed={collapsed} mobile={mobile}
        open={mobileOpen} onClose={()=>setMobileOpen(false)}
      />
      <div style={{
        flex:1,
        marginLeft: mobile ? 0 : sidebarW,
        minWidth:0,
        transition:"margin-left .2s ease",
      }}>
        <Topbar
          page={page} user={authUser}
          onLogout={()=>setAuthUser(null)}
          mobile={mobile}
          onMenuOpen={()=>setMobileOpen(true)}
        />
        <main style={{
          padding:`${contentPy}px ${contentPx}px`,
          width:"100%",
          boxSizing:"border-box",
        }}>
          {pages[page]||<Dashboard/>}
        </main>
      </div>
    </div>
  );
}