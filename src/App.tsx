import React, { useState } from 'react';

// ===== 설정값 =====
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxePUT_HNDgqCsti0LhNWx0-iibiKECDCFO_snoZvhV0MBTAs1G8LKtu4c23kQbINQxSg/exec';
const CLOUDINARY_CLOUD_NAME = 'deyljykwb';
const CLOUDINARY_UPLOAD_PRESET = 'yucylwb1';

// 회사 목록 (추가 시 여기에 추가)
const COMPANY_LIST = ['애드', '플라'];

// 회사별 팀 목록
const TEAM_LIST: Record<string, string[]> = {
  '애드': ['이지','행복','희망','다온','나무','드림','조은','이룸','위너','영광','위비','리더','제니'],
  '플라': ['에스엠','나누미','더나눔','베품','미라클','빅토리','더쉴','비상','라온','챌린저'],
};

const PACKAGES = [
  { name: '스마트 Smart',    price: '4,400,000원', desc: '개인회생 신청 핵심 서비스' },
  { name: '스탠다드 Standard', price: '6,600,000원', desc: '서류대행 + 가압류방어 3회 포함' },
  { name: '올 케어 All care', price: '8,800,000원', desc: '재접수·파산전환 무한 케어' },
];

type Screen = 'intro' | 'step0' | 'step1' | 'step2' | 'result' | 'done';

// 전화번호 자동 포맷팅
const formatPhone = (val: string): string => {
  let digits = val.replace(/\D/g, '');
  if (digits.length === 10 && digits[0] !== '0') digits = '0' + digits;
  if (digits.length === 11) return digits.slice(0,3) + '-' + digits.slice(3,7) + '-' + digits.slice(7);
  if (digits.length === 10) return digits.slice(0,3) + '-' + digits.slice(3,6) + '-' + digits.slice(6);
  return digits;
};

// 주민번호 자동 포맷팅 (13자리 → 6자리-7자리)
const formatRRN = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 6) return digits;
  return digits.slice(0, 6) + '-' + digits.slice(6);
};

// 주민번호 유효성 검사 (13자리 완성 여부)
const isValidRRN = (val: string): boolean => {
  const digits = val.replace(/\D/g, '');
  return digits.length === 13;
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 의뢰인 정보
  const [marital, setMarital]           = useState('미혼');
  const [childrenCount, setChildrenCount] = useState('');
  const [income, setIncome]             = useState('');
  const [debt, setDebt]                 = useState('');
  const [contactName, setContactName]   = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRRN, setContactRRN]     = useState('');  // 주민번호
  const [callTime, setCallTime]         = useState('언제든 가능');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging]     = useState(false);

  // 거주형태
  const [housingType, setHousingType] = useState('');
  const [deposit, setDeposit]         = useState('');
  const [housePrice, setHousePrice]   = useState('');
  const [mortgage, setMortgage]       = useState('');

  // 담당자 정보
  const [managerName, setManagerName]       = useState('');
  const [companyName, setCompanyName]       = useState('');
  const [teamName, setTeamName]             = useState('');
  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[0]);
  // ★ 신규: 실제 안내금액 (숫자만 저장). 패키지 기본가로 초기화
  const [annaeAmount, setAnnaeAmount] = useState(PACKAGES[0].price.replace(/[^0-9]/g, ''));

  // 면책기간 + 특이사항
  const [exemptionStatus, setExemptionStatus] = useState('없음');
  const [memo, setMemo] = useState('');

  // ===== 비밀번호 계산 =====
  const COMPANY_CODE_MAP: Record<string, string> = { '애드': 'ad', '플라': 'pl' };
  const INITIAL_MAP: Record<string, string> = {
    'ㄱ':'g','ㄴ':'n','ㄷ':'d','ㄹ':'r','ㅁ':'m','ㅂ':'b','ㅅ':'s','ㅇ':'w',
    'ㅈ':'j','ㅊ':'c','ㅋ':'k','ㅌ':'t','ㅍ':'p','ㅎ':'h','ㄲ':'g','ㄸ':'d','ㅃ':'b','ㅆ':'s','ㅉ':'j'
  };
  const getInitial = (ch: string): string => {
    const code = ch.charCodeAt(0) - 0xAC00;
    if (code < 0 || code > 11171) return ch.toLowerCase();
    const choseong = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
    return INITIAL_MAP[choseong[Math.floor(code / 588)]] || ch.toLowerCase();
  };
  const calcInitialPw = (): string => {
    if (!companyName || !managerName) return '';
    const nameOnly = managerName.trim().slice(1);
    let initials = '';
    for (let i = 0; i < nameOnly.length; i++) initials += getInitial(nameOnly[i]);
    const companyCode = COMPANY_CODE_MAP[companyName] || companyName.toLowerCase().slice(0, 2);
    return initials + '-' + companyCode + '-1234';
  };

  // ===== 유틸 =====
  const fmt = (val: string) =>
    val.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const num = (val: string) => Number(val.replace(/,/g, ''));
  const krw = (n: number) => {
    if (!n) return '';
    const eok = Math.floor(n / 100000000);
    const man = Math.floor((n % 100000000) / 10000);
    return `${eok > 0 ? eok + '억 ' : ''}${man > 0 ? man + '만 ' : ''}원`;
  };

  // ===== 파일 처리 =====
  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 용량이 너무 큽니다. (10MB 이하만 가능)');
      return;
    }
    setAttachedFile(file);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const body = new FormData();
    body.append('file', file);
    body.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    body.append('folder', 'saero_nice');
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      { method: 'POST', body }
    );
    if (!res.ok) throw new Error('업로드 실패');
    const data = await res.json();
    return data.secure_url;
  };

  // ===== 진단 실행 =====
  const runDiagnosis = () => {
    if (!income || !debt) {
      alert('월수입과 총채무를 입력해주세요.');
      return;
    }
    if (!housingType) {
      alert('거주형태를 선택해주세요.');
      return;
    }
    if (!attachedFile) {
      alert('NICE 신용정보 파일을 첨부해주세요.');
      return;
    }
    setScreen('result');
  };

  // ===== 최종 제출 =====
  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!contactName || !contactPhone) {
      alert('성함과 연락처를 모두 입력해주세요.');
      return;
    }
    // 주민번호 필수 검증
    if (!isValidRRN(contactRRN)) {
      alert('주민등록번호 13자리를 정확히 입력해주세요.');
      return;
    }
    setIsSubmitting(true);

    try {
      let niceUrl = '첨부없음';
      if (attachedFile) {
        try {
          niceUrl = await uploadToCloudinary(attachedFile);
        } catch {
          niceUrl = '업로드실패';
        }
      }

      // 유입경로를 "회사-팀명" 형식으로 조합
      const sourceValue = teamName ? (companyName + '-' + teamName) : companyName;

      const payload = {
        "접수일시":     new Date().toLocaleString('ko-KR'),
        "성함":         contactName,
        "연락처":       contactPhone,
        "희망상담시간": callTime,
        "결혼여부":     marital,
        "월수입":       fmt(income) + '만원',
        "총채무":       fmt(debt) + '만원',
        "거주형태":     housingType,
        "보증금":       housingType !== '자가' ? (fmt(deposit) + '만원') : '-',
        "시세":         housingType === '자가' ? (fmt(housePrice) + '만원') : '-',
        "담보채무":     housingType === '자가' ? (fmt(mortgage) + '만원') : '-',
        "부양가족":     (childrenCount || '0') + '명',
        "수임료":       selectedPackage.price,
        "패키지":       selectedPackage.name,
        "NICE신용정보": niceUrl,
        "유입경로":     sourceValue,
        "담당자":       managerName.trim(),
        "면책기간":     exemptionStatus,
        "광고특이사항": memo,
        "주민번호":     contactRRN,
        // ★ 신규: 실제 안내금액 (수정값, 없으면 패키지 기본가)
        "안내금액":     annaeAmount ? (fmt(annaeAmount) + '원') : selectedPackage.price,
      };

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });

    } catch (e) {
      console.error('제출 오류:', e);
    } finally {
      setScreen('done');
      setIsSubmitting(false);
    }
  };

  // ===== 초기화 =====
  const resetAll = () => {
    setScreen('intro');
    setIncome(''); setDebt('');
    setContactName(''); setContactPhone('');
    setContactRRN('');
    setManagerName(''); setCompanyName('');
    setTeamName('');
    setAttachedFile(null);
    setMarital('미혼'); setChildrenCount('');
    setHousingType(''); setDeposit('');
    setHousePrice(''); setMortgage('');
    setSelectedPackage(PACKAGES[0]);
    setAnnaeAmount(PACKAGES[0].price.replace(/[^0-9]/g, ''));  // ★ 신규
    setCallTime('언제든 가능');
    setExemptionStatus('없음');
    setMemo('');
  };

  return (
    <div style={s.wrap}>

      {/* ========== 인트로 ========== */}
      {screen === 'intro' && (
        <div style={s.screen}>
          <div style={{ textAlign: 'center' }}>
            <span style={s.badge}>법무법인 하이브 새로회생센터</span>
          </div>
          <h1 style={s.title}>
            지긋지긋한 채무,<br />
            <span style={{ color: '#2563eb' }}>나의 해결책은?</span>
          </h1>
          <p style={s.sub}>
            변호사가 검토하는 2026 최신 기준 리포트.<br />
            <b>지금 바로 내 사건의 해결책을 확인하세요.</b>
          </p>
          <div style={s.trustBox}>
            <div style={s.trustItem}>✅ <b>회생법원 2026 실무준칙</b> 성공사례 적용</div>
            <div style={s.trustItem}>✅ <b>1:1 분석</b> 나에게 딱 맞는 맞춤형 솔루션</div>
            <div style={s.trustItem}>✅ <b>비밀보장</b> 가족/직장 모르게 철저 보안</div>
          </div>
          <button style={s.mainBtn} onClick={() => setScreen('step0')}>
            무료 자가진단 시작하기
          </button>
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>
            대표번호: 1551-7473
          </div>
        </div>
      )}

      {/* ========== Step 0: 광고회사 직원 정보 + 패키지 ========== */}
      {screen === 'step0' && (
        <div style={{...s.screen, background: '#fef3c7', borderLeft: '6px solid #f59e0b'}}>
          {/* 상단 경고 배너 */}
          <div style={s.warnBanner}>
            <div style={s.warnBannerTitle}>🏢 광고회사 직원 정보 (본인이 입력)</div>
            <div style={s.warnBannerDesc}>
              ⚠️ <b>의뢰인 이름이 아닌 '광고회사 직원 본인'</b> 이름을 입력하세요.<br />
              의뢰인 정보는 마지막 화면에서 입력합니다.
            </div>
          </div>

          <div style={s.group}>
            <label style={s.label}>👤 내 이름 <span style={{color:'#dc2626'}}>(직원 본인)</span></label>
            <input type="text" style={s.input}
              placeholder="예: 김철수 (본인 성함)"
              value={managerName} onChange={e => setManagerName(e.target.value)} />
            <div style={s.helpText}>
              ℹ️ 의뢰인 이름은 마지막 화면에서 입력합니다
            </div>
          </div>

          <div style={s.group}>
            <label style={s.label}>🏢 내 소속 회사</label>
            <select style={s.selectInput} value={companyName}
              onChange={e => { setCompanyName(e.target.value); setTeamName(''); }}>
              <option value="">회사를 선택하세요</option>
              {COMPANY_LIST.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {companyName && TEAM_LIST[companyName] && (
            <div style={s.group}>
              <label style={s.label}>👥 내 소속 팀</label>
              <select style={s.selectInput} value={teamName}
                onChange={e => setTeamName(e.target.value)}>
                <option value="">팀을 선택하세요</option>
                {TEAM_LIST[companyName].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}

          {/* 패키지 선택 + 예시 설명 카드 */}
          <div style={s.group}>
            <label style={s.label}>📦 수임료 패키지 선택</label>
            <select style={s.selectInput} value={selectedPackage.name}
              onChange={e => {
                const pkg = PACKAGES.find(p => p.name === e.target.value);
                if (pkg) {
                  setSelectedPackage(pkg);
                  setAnnaeAmount(pkg.price.replace(/[^0-9]/g, ''));  // ★ 패키지 변경 시 기본가 자동 세팅
                }
              }}>
              {PACKAGES.map(pkg => (
                <option key={pkg.name} value={pkg.name}>
                  {pkg.name} — {pkg.price}
                </option>
              ))}
            </select>
            <div style={s.packageCard}>
              <div style={s.packageCardName}>{selectedPackage.name}</div>
              <div style={s.packageCardPrice}>기본가 {selectedPackage.price}</div>
              <div style={s.packageCardDesc}>{selectedPackage.desc}</div>
            </div>
          </div>

          {/* ★ 신규: 실제 안내 금액 입력칸 */}
          <div style={s.group}>
            <label style={s.label}>
              💰 실제 안내 금액 <span style={{color:'#dc2626'}}>(의뢰인에게 안내한 금액)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input type="text" inputMode="numeric" style={s.input}
                value={fmt(annaeAmount)}
                onChange={e => setAnnaeAmount(e.target.value.replace(/\D/g, ''))} />
              <span style={s.unit}>원</span>
            </div>
            <div style={s.helpText}>
              ℹ️ 패키지 기본가가 자동 입력됩니다. 다르게 안내했다면 수정하세요.<br />
              (예: 스마트를 500만원으로 안내 → 5,000,000 으로 수정)
            </div>
            {annaeAmount && annaeAmount !== selectedPackage.price.replace(/[^0-9]/g, '') && (
              <div style={s.warnInline}>
                💡 기본가({selectedPackage.price})와 다르게 안내됨 → {fmt(annaeAmount)}원
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={s.prevBtn} onClick={() => setScreen('intro')}>이전</button>
            <button style={{ ...s.mainBtn, flex: 1 }} onClick={() => {
              if (!managerName || !companyName) {
                alert('직원 본인 이름과 소속 회사를 모두 입력해주세요.');
                return;
              }
              if (TEAM_LIST[companyName] && !teamName) {
                alert('소속 팀을 선택해주세요.');
                return;
              }
              if (!annaeAmount) {
                alert('실제 안내 금액을 입력해주세요.');
                return;
              }
              setScreen('step1');
            }}>다음 단계로</button>
          </div>
        </div>
      )}

      {/* ========== Step 1: 가구 정보 ========== */}
      {screen === 'step1' && (
        <div style={s.screen}>
          <div style={s.clientHeader}>
            <span style={{fontWeight:'900', color:'#2563eb'}}>📋 의뢰인 정보 입력</span>
            <span style={{fontSize:'12px', color:'#64748b', marginLeft:'8px'}}>
              담당: {managerName} ({companyName}{teamName ? '-'+teamName : ''})
            </span>
          </div>

          <h2 style={s.stepTitle}>1. 가구 및 부양 상황</h2>
          <div style={s.group}>
            <label style={s.label}>결혼 형태</label>
            <div style={s.grid3}>
              {['미혼', '결혼', '기타'].map(v => (
                <button key={v} onClick={() => setMarital(v)}
                  style={marital === v ? s.selActive : s.sel}>{v}</button>
              ))}
            </div>
          </div>
          <div style={s.group}>
            <label style={s.label}>부양가족 수 (미성년 자녀/부모님)</label>
            <input type="number" inputMode="numeric" min="0" style={s.input} placeholder="0"
              value={childrenCount} onChange={e => setChildrenCount(e.target.value)} />
          </div>

          <div style={s.group}>
            <label style={s.label}>과거 개인회생/파산 면책 이력</label>
            <div style={s.grid3}>
              {['없음', '5년 이상 경과', '5년 미만'].map(v => (
                <button key={v} onClick={() => setExemptionStatus(v)}
                  style={exemptionStatus === v ? s.selActive : s.sel}>{v}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={s.prevBtn} onClick={() => setScreen('step0')}>이전</button>
            <button style={{ ...s.mainBtn, flex: 1 }} onClick={() => setScreen('step2')}>다음 단계로</button>
          </div>
        </div>
      )}

      {/* ========== Step 2: 경제 상황 ========== */}
      {screen === 'step2' && (
        <div style={s.screen}>
          <div style={s.clientHeader}>
            <span style={{fontWeight:'900', color:'#2563eb'}}>📋 의뢰인 정보 입력</span>
            <span style={{fontSize:'12px', color:'#64748b', marginLeft:'8px'}}>
              담당: {managerName} ({companyName}{teamName ? '-'+teamName : ''})
            </span>
          </div>

          <h2 style={s.stepTitle}>2. 경제 상황 진단</h2>

          <div style={s.group}>
            <label style={s.label}>월 평균 수입 (실수령액, 만원 단위)</label>
            <div style={{ position: 'relative' }}>
              <input type="text" inputMode="numeric" style={s.input}
                value={fmt(income)} onChange={e => setIncome(e.target.value.replace(/\D/g, ''))} />
              <span style={s.unit}>만원</span>
            </div>
            <div style={s.krw}>{krw(num(income) * 10000)}</div>
          </div>

          <div style={s.group}>
            <label style={s.label}>총 채무 원금 합계 (만원 단위)</label>
            <div style={{ position: 'relative' }}>
              <input type="text" inputMode="numeric" style={s.input}
                value={fmt(debt)} onChange={e => setDebt(e.target.value.replace(/\D/g, ''))} />
              <span style={s.unit}>만원</span>
            </div>
            <div style={s.krw}>{krw(num(debt) * 10000)}</div>
          </div>

          <div style={s.group}>
            <label style={s.label}>거주형태 (배우자 명의 포함)</label>
            <div style={s.grid3}>
              {['자가', '전세', '월세'].map(v => (
                <button key={v}
                  onClick={() => { setHousingType(v); setDeposit(''); setHousePrice(''); setMortgage(''); }}
                  style={housingType === v ? s.selActive : s.sel}>{v}</button>
              ))}
            </div>
          </div>

          {housingType === '자가' && (
            <>
              <div style={s.group}>
                <label style={s.label}>부동산 시세 (만원 단위)</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" inputMode="numeric" style={s.input}
                    value={fmt(housePrice)} onChange={e => setHousePrice(e.target.value.replace(/\D/g, ''))} />
                  <span style={s.unit}>만원</span>
                </div>
                <div style={s.krw}>{krw(num(housePrice) * 10000)}</div>
              </div>
              <div style={s.group}>
                <label style={s.label}>담보채무 (만원 단위)</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" inputMode="numeric" style={s.input}
                    value={fmt(mortgage)} onChange={e => setMortgage(e.target.value.replace(/\D/g, ''))} />
                  <span style={s.unit}>만원</span>
                </div>
                <div style={s.krw}>{krw(num(mortgage) * 10000)}</div>
              </div>
            </>
          )}

          {(housingType === '전세' || housingType === '월세') && (
            <div style={s.group}>
              <label style={s.label}>보증금 (만원 단위)</label>
              <div style={{ position: 'relative' }}>
                <input type="text" inputMode="numeric" style={s.input}
                  value={fmt(deposit)} onChange={e => setDeposit(e.target.value.replace(/\D/g, ''))} />
                <span style={s.unit}>만원</span>
              </div>
              <div style={s.krw}>{krw(num(deposit) * 10000)}</div>
            </div>
          )}

          <div style={s.group}>
            <label style={s.label}>NICE 신용정보 첨부 (필수)</label>
            <div
              onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
              style={{
                ...s.input, padding: '20px', textAlign: 'center',
                border: isDragging ? '2px dashed #2563eb' : '2px dashed #cbd5e1',
                background: isDragging ? '#eff6ff' : '#fff', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
              onClick={() => document.getElementById('fileInput')?.click()}>
              <input id="fileInput" type="file" accept="image/*,.pdf"
                style={{ display: 'none' }} onChange={handleFileChange} />
              <div style={{ fontSize: '24px' }}>📂</div>
              <div style={{ fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>
                {attachedFile ? (
                  <span style={{ color: '#2563eb' }}>✅ {attachedFile.name}</span>
                ) : (
                  <>클릭하거나 파일을 여기로 드래그하세요<br />
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'normal' }}>(이미지, PDF / 10MB 이하)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={s.prevBtn} onClick={() => setScreen('step1')}>이전</button>
            <button style={{ ...s.mainBtn, flex: 1 }} onClick={runDiagnosis}>진단 리포트 생성</button>
          </div>
        </div>
      )}

      {/* ========== 결과 화면 ========== */}
      {screen === 'result' && (
        <div style={s.screen}>
          <div style={s.resultCard}>
            <div style={s.resultBadge}>진단 완료</div>
            <h2 style={{ ...s.resTitle, color: '#2563eb' }}>개인회생 가능성 높음</h2>
            <div style={s.resDesc}>
              입력하신 내용을 바탕으로 분석한 결과,{' '}
              <b>개인회생 절차를 통해 채무를 대폭 줄일 수 있는 가능성이 높습니다.</b>
              <br /><br />
              정확한 변제금액과 면책 가능 여부는 전문 변호사와의 1:1 상담을 통해 확인해드리겠습니다.
            </div>
            <div style={s.resultPackageBox}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>선택 패키지</div>
              <div style={{ fontWeight: '900', fontSize: '16px', color: '#1e293b' }}>{selectedPackage.name}</div>
              {/* ★ 안내금액이 기본가와 다르면 안내금액을, 같으면 기본가를 표시 */}
              <div style={{ fontWeight: '800', fontSize: '20px', color: '#2563eb', marginTop: '2px' }}>
                {annaeAmount ? (fmt(annaeAmount) + '원') : selectedPackage.price}
              </div>
            </div>
          </div>
          <div style={s.formCard}>
            <h4 style={s.formTitle}>📋 의뢰인 정보 입력</h4>

            <div style={{fontSize:'12px', color:'#94a3b8', textAlign:'center', marginBottom:'4px'}}>
              아래는 <b style={{color:'#fbbf24'}}>의뢰인(상담받을 분)</b>의 정보입니다
            </div>

            <input type="text" placeholder="의뢰인 성함" style={s.inputDark}
              value={contactName} onChange={e => setContactName(e.target.value)} />

            {contactName && managerName && contactName.trim() === managerName.trim() && (
              <div style={s.warnInline}>
                ⚠️ 직원 본인 이름({managerName})과 동일합니다. 의뢰인 본인 성함이 맞는지 확인해주세요.
              </div>
            )}

            <input type="tel" placeholder="의뢰인 연락처 (숫자만 입력)" style={s.inputDark}
              value={contactPhone}
              onChange={e => {
                const raw = e.target.value.replace(/\D/g, '');
                setContactPhone(raw);
              }}
              onBlur={() => {
                if (contactPhone) setContactPhone(formatPhone(contactPhone));
              }} />

            <input type="text" inputMode="numeric"
              placeholder="의뢰인 주민등록번호 13자리"
              style={s.inputDark}
              value={contactRRN}
              onChange={e => setContactRRN(formatRRN(e.target.value))}
              maxLength={14} />
            <div style={{fontSize:'11px', color:'#94a3b8', marginTop:'-6px', paddingLeft:'4px'}}>
              🔒 법률에 의해 비밀보장됩니다
            </div>

            <select style={s.selectInputDark} value={callTime} onChange={e => setCallTime(e.target.value)}>
              <option value="언제든 가능">희망 상담 시간: 언제든</option>
              <option value="오전 (09~12시)">오전 (09~12시)</option>
              <option value="점심 (12~13시)">점심 시간 활용</option>
              <option value="오후 (13~18시)">오후 (13~18시)</option>
            </select>

            <textarea placeholder={"특이사항 (선택사항)\n예: 오후 3시 이후 통화 가능, 카드 진행 예정 등"}
              style={{...s.inputDark, minHeight: '80px', resize: 'vertical' as const}}
              value={memo} onChange={e => setMemo(e.target.value)} />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={s.prevBtn} onClick={() => setScreen('step2')}>이전</button>
              <button
                style={{ ...s.submitBtn, flex: 1, marginTop: 0, opacity: isSubmitting ? 0.7 : 1 }}
                onClick={handleSubmit}
                disabled={isSubmitting}>
                {isSubmitting ? '업로드 중...' : '무료 리포트 신청'}
              </button>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
            모든 정보는 법률에 의해 비밀이 보장됩니다.
          </p>
        </div>
      )}

      {/* ========== 완료 화면 ========== */}
      {screen === 'done' && (
        <div style={{ ...s.screen, textAlign: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '70px' }}>🎉</div>
          <h2>신청이 완료되었습니다.</h2>
          <p style={{ color: '#64748b', lineHeight: '1.7' }}>
            전문 상담팀이 입력하신 내용을 바탕으로<br />
            <b>더 세부적으로 분석하여 곧 연락드리겠습니다.</b>
          </p>

          {/* 현황판 로그인 정보 */}
          <div style={{
            background: '#eff6ff', border: '2px solid #bfdbfe',
            borderRadius: '16px', padding: '20px', marginTop: '8px', textAlign: 'left'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e40af', marginBottom: '8px' }}>
              상담 현황판 로그인 정보
            </div>
            <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.8' }}>
              <b>담당자명:</b> {managerName}<br />
              <b>회사명:</b> {companyName}<br />
              <b>초기 비밀번호:</b>{' '}
              <span style={{ color: '#2563eb', fontWeight: '900', fontSize: '16px' }}>
                {calcInitialPw()}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
              위 정보로 현황판에 로그인하시면 의뢰인 진행상황을 실시간으로 확인하실 수 있습니다.
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>기다리기 어려우시다면?</p>
            <a href="tel:1551-7473" style={s.callBtn}>1551-7473 즉시 연결</a>
          </div>
          <button
            style={{ ...s.mainBtn, marginTop: '20px', background: '#f1f5f9', color: '#475569' }}
            onClick={resetAll}>
            처음으로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}

const s: any = {
  wrap: { maxWidth: '480px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Pretendard, sans-serif' },
  screen: { padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '24px' },
  badge: { background: '#e2e8f0', color: '#475569', padding: '6px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: '800' },
  title: { fontSize: '32px', fontWeight: '900', color: '#0f172a', lineHeight: '1.2' },
  sub: { fontSize: '16px', color: '#64748b', lineHeight: '1.5' },
  trustBox: { display: 'flex', flexDirection: 'column', gap: '8px', background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' },
  trustItem: { fontSize: '14px', color: '#334155' },
  mainBtn: { background: '#2563eb', color: '#fff', border: 'none', padding: '20px', borderRadius: '16px', fontSize: '18px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(37,99,235,0.4)' },
  stepTitle: { fontSize: '22px', fontWeight: '800', color: '#1e293b' },
  group: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '14px', fontWeight: '700', color: '#475569' },
  input: { width: '100%', padding: '18px', borderRadius: '14px', border: '2px solid #e2e8f0', fontSize: '17px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#1e293b' },
  unit: { position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: '#94a3b8' },
  krw: { textAlign: 'right', fontSize: '13px', color: '#2563eb', fontWeight: '800' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' },
  sel: { padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff', fontWeight: '700', cursor: 'pointer' },
  selActive: { padding: '16px', borderRadius: '12px', border: '2px solid #2563eb', background: '#eff6ff', color: '#2563eb', fontWeight: '900', cursor: 'pointer' },
  selectInput: { padding: '16px', borderRadius: '14px', fontSize: '15px', border: '2px solid #e2e8f0', background: '#fff', width: '100%', fontWeight: '700', color: '#1e293b', outline: 'none', boxSizing: 'border-box' },
  packageCard: { background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' },
  packageCardName: { fontSize: '15px', fontWeight: '900', color: '#1e40af' },
  packageCardPrice: { fontSize: '22px', fontWeight: '900', color: '#2563eb' },
  packageCardDesc: { fontSize: '13px', color: '#64748b' },
  resultCard: { background: '#fff', padding: '30px', borderRadius: '28px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
  resultBadge: { display: 'inline-block', background: '#dbeafe', color: '#1d4ed8', padding: '6px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: '800', marginBottom: '8px' },
  resTitle: { fontSize: '26px', fontWeight: '900', margin: '15px 0' },
  resDesc: { background: '#f8fafc', padding: '20px', borderRadius: '16px', color: '#334155', fontSize: '15px', lineHeight: '1.6', textAlign: 'left' },
  resultPackageBox:{ marginTop: '16px', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '14px', padding: '16px', textAlign: 'center' },
  formCard: { background: '#1e293b', padding: '28px', borderRadius: '28px', display: 'flex', flexDirection: 'column', gap: '12px' },
  formTitle: { color: '#fbbf24', fontSize: '20px', fontWeight: '900', textAlign: 'center' },
  inputDark: { width: '100%', padding: '18px', borderRadius: '14px', border: '2px solid #334155', fontSize: '17px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', background: '#0f172a', color: '#f1f5f9' },
  selectInputDark: { padding: '16px', borderRadius: '14px', fontSize: '15px', border: '2px solid #334155', background: '#0f172a', color: '#f1f5f9', width: '100%', fontWeight: '700', outline: 'none', boxSizing: 'border-box' },
  submitBtn: { background: '#fbbf24', color: '#1e293b', border: 'none', padding: '18px', borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: 'pointer' },
  callBtn: { display: 'block', background: '#1e293b', color: '#fff', textDecoration: 'none', padding: '18px', borderRadius: '16px', fontWeight: 'bold', fontSize: '18px' },
  prevBtn: { background: '#e2e8f0', color: '#475569', border: 'none', padding: '18px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', width: '80px' },

  // 스타일
  warnBanner: { background: '#fff', border: '2px solid #f59e0b', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 12px rgba(245,158,11,0.15)' },
  warnBannerTitle: { fontSize: '18px', fontWeight: '900', color: '#92400e' },
  warnBannerDesc: { fontSize: '13px', color: '#78350f', lineHeight: '1.6' },
  helpText: { fontSize: '12px', color: '#92400e', fontWeight: '600', paddingLeft: '4px' },
  clientHeader: { background: '#eff6ff', padding: '12px 16px', borderRadius: '12px', borderLeft: '4px solid #2563eb', fontSize: '14px' },
  warnInline: { background: '#fef3c7', color: '#92400e', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', marginTop: '-6px' },
};
