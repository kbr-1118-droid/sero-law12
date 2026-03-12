import React, { useState } from 'react';

// ===== 설정값 =====
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwMhmA-g4oFh0Tj_nhnI9vMqVungEKkuuJ37WJf1nL_v05pAwd-kadzkwgL58hnDqTv5Q/exec';
const CLOUDINARY_CLOUD_NAME = 'deyljykwb';
const CLOUDINARY_UPLOAD_PRESET = 'yucylwb1';
// ==================

const PACKAGES = [
  { name: '스마트 Smart', price: '4,400,000원', desc: '개인회생 신청 핵심 서비스' },
  { name: '스탠다드 Standard', price: '6,600,000원', desc: '서류대행 + 가압류방어 3회 포함' },
  { name: '올 케어 All care', price: '8,800,000원', desc: '재접수·파산전환 무한 케어' },
];

type Screen = 'intro' | 'step0' | 'step1' | 'step2' | 'result' | 'done';

export default function App() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [marital, setMarital] = useState('미혼');
  const [childrenCount, setChildrenCount] = useState('');
  const [income, setIncome] = useState('');
  const [debt, setDebt] = useState('');
  const [assets, setAssets] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [managerName, setManagerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [callTime, setCallTime] = useState('언제든 가능');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[0]);

  const fmt = (val: string) =>
    val.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const num = (val: string) => Number(val.replace(/,/g, ''));
  const krw = (n: number) => {
    if (!n) return '';
    const eok = Math.floor(n / 100000000);
    const man = Math.floor((n % 100000000) / 10000);
    return `${eok > 0 ? eok + '억 ' : ''}${man > 0 ? man + '만 ' : ''}원`;
  };

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

  const runDiagnosis = () => {
    if (!income || !debt || !assets) {
      alert('모든 경제 상황 항목을 입력해주세요.');
      return;
    }
    if (!attachedFile) {
      alert('NICE 신용정보 파일을 첨부해주세요.');
      return;
    }
    setScreen('result');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!contactName || !contactPhone) {
      alert('성함과 연락처를 모두 입력해주세요.');
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

      const payload = {
        "접수일시":     new Date().toLocaleString('ko-KR'),
        "성함":         contactName,
        "연락처":       contactPhone,
        "희망상담시간": callTime,
        "결혼여부":     marital,
        "월수입":       fmt(income) + '원',
        "총채무":       fmt(debt) + '만원',
        "재산가치":     fmt(assets) + '만원',
        "부양가족":     (childrenCount || '0') + '명',
        "수임료":       selectedPackage.price,
        "패키지":       selectedPackage.name,
        "NICE신용정보": niceUrl,
        "유입경로":     companyName,
        "담당자":       managerName,
      };

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });

    } catch (e) {
      console.error('오류:', e);
    } finally {
      setScreen('done');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={s.wrap}>

      {/* 인트로 */}
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
            대표번호: 📞 1551-7473
          </div>
        </div>
      )}

      {/* Step 0: 담당자 정보 + 패키지 선택 */}
      {screen === 'step0' && (
        <div style={s.screen}>
          <h2 style={s.stepTitle}>담당자 정보 입력</h2>
          <div style={s.group}>
            <label style={s.label}>담당자 성함</label>
            <input type="text" style={s.input} placeholder="담당자 성함을 입력하세요"
              value={managerName} onChange={e => setManagerName(e.target.value)} />
          </div>
          <div style={s.group}>
            <label style={s.label}>회사명</label>
            <input type="text" style={s.input} placeholder="회사명을 입력하세요"
              value={companyName} onChange={e => setCompanyName(e.target.value)} />
          </div>
          <div style={s.group}>
            <label style={s.label}>수임료 패키지 선택</label>
            <select style={s.selectInput} value={selectedPackage.name}
              onChange={e => {
                const pkg = PACKAGES.find(p => p.name === e.target.value);
                if (pkg) setSelectedPackage(pkg);
              }}>
              {PACKAGES.map(pkg => (
                <option key={pkg.name} value={pkg.name}>
                  {pkg.name} — {pkg.price}
                </option>
              ))}
            </select>
            <div style={s.packageCard}>
              <div style={s.packageCardName}>{selectedPackage.name}</div>
              <div style={s.packageCardPrice}>{selectedPackage.price}</div>
              <div style={s.packageCardDesc}>{selectedPackage.desc}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={s.prevBtn} onClick={() => setScreen('intro')}>이전</button>
            <button style={{ ...s.mainBtn, flex: 1 }} onClick={() => {
              if (!managerName || !companyName) {
                alert('담당자 성함과 회사명을 모두 입력해주세요.');
                return;
              }
              setScreen('step1');
            }}>다음 단계로</button>
          </div>
        </div>
      )}

      {/* Step 1 */}
      {screen === 'step1' && (
        <div style={s.screen}>
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={s.prevBtn} onClick={() => setScreen('step0')}>이전</button>
            <button style={{ ...s.mainBtn, flex: 1 }} onClick={() => setScreen('step2')}>다음 단계로</button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {screen === 'step2' && (
        <div style={s.screen}>
          <h2 style={s.stepTitle}>2. 경제 상황 진단</h2>
          <div style={s.group}>
            <label style={s.label}>월 평균 수입 (실수령액)</label>
            <div style={{ position: 'relative' }}>
              <input type="text" inputMode="numeric" style={s.input}
                value={fmt(income)} onChange={e => setIncome(e.target.value.replace(/\D/g, ''))} />
              <span style={s.unit}>원</span>
            </div>
            <div style={s.krw}>{krw(num(income))}</div>
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
            <label style={s.label}>보유 재산 가액 (만원 단위)</label>
            <div style={{ position: 'relative' }}>
              <input type="text" inputMode="numeric" style={s.input}
                value={fmt(assets)} onChange={e => setAssets(e.target.value.replace(/\D/g, ''))} />
              <span style={s.unit}>만원</span>
            </div>
            <div style={s.krw}>{krw(num(assets) * 10000)}</div>
          </div>
          <div style={s.group}>
            <label style={s.label}>NICE 신용정보 첨부 (필수)</label>
            <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
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

      {/* 결과 */}
      {screen === 'result' && (
        <div style={s.screen}>
          <div style={s.resultCard}>
            <div style={s.resultBadge}>📋 진단 완료</div>
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
              <div style={{ fontWeight: '800', fontSize: '20px', color: '#2563eb', marginTop: '2px' }}>{selectedPackage.price}</div>
            </div>
          </div>
          <div style={s.formCard}>
            <h4 style={s.formTitle}>📋 상세 분석 리포트 신청</h4>
            <input type="text" placeholder="성함" style={s.inputDark}
              value={contactName} onChange={e => setContactName(e.target.value)} />
            <input type="tel" placeholder="연락처 (숫자만)" style={s.inputDark}
              value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
            <select style={s.selectInputDark} value={callTime} onChange={e => setCallTime(e.target.value)}>
              <option value="언제든 가능">희망 상담 시간: 언제든</option>
              <option value="오전 (09~12시)">오전 (09~12시)</option>
              <option value="점심 (12~13시)">점심 시간 활용</option>
              <option value="오후 (13~18시)">오후 (13~18시)</option>
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={s.prevBtn} onClick={() => setScreen('step2')}>이전</button>
              <button style={{ ...s.submitBtn, flex: 1, marginTop: 0, opacity: isSubmitting ? 0.7 : 1 }}
                onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? '⏳ 업로드 중...' : '무료 리포트 신청'}
              </button>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
            🔒 모든 정보는 법률에 의해 비밀이 보장됩니다.
          </p>
        </div>
      )}

      {/* 완료 */}
      {screen === 'done' && (
        <div style={{ ...s.screen, textAlign: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '70px' }}>🎉</div>
          <h2>신청이 완료되었습니다.</h2>
          <p style={{ color: '#64748b', lineHeight: '1.7' }}>
            전문 상담팀이 입력하신 내용을 바탕으로<br />
            <b>더 세부적으로 분석하여 곧 연락드리겠습니다.</b>
          </p>
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>기다리기 어려우시다면?</p>
            <a href="tel:1551-7473" style={s.callBtn}>📞 1551-7473 즉시 연결</a>
          </div>
          <button style={{ ...s.mainBtn, marginTop: '20px', background: '#f1f5f9', color: '#475569' }}
            onClick={() => {
              setScreen('intro');
              setIncome(''); setDebt(''); setAssets('');
              setContactName(''); setContactPhone('');
              setManagerName(''); setCompanyName('');
              setAttachedFile(null);
              setMarital('미혼'); setChildrenCount('');
              setSelectedPackage(PACKAGES[0]);
            }}>
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
  resultPackageBox: { marginTop: '16px', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '14px', padding: '16px', textAlign: 'center' },
  formCard: { background: '#1e293b', padding: '28px', borderRadius: '28px', display: 'flex', flexDirection: 'column', gap: '12px' },
  formTitle: { color: '#fbbf24', fontSize: '20px', fontWeight: '900', textAlign: 'center' },
  inputDark: { width: '100%', padding: '18px', borderRadius: '14px', border: '2px solid #334155', fontSize: '17px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', background: '#0f172a', color: '#f1f5f9' },
  selectInputDark: { padding: '16px', borderRadius: '14px', fontSize: '15px', border: '2px solid #334155', background: '#0f172a', color: '#f1f5f9', width: '100%', fontWeight: '700', outline: 'none', boxSizing: 'border-box' },
  submitBtn: { background: '#fbbf24', color: '#1e293b', border: 'none', padding: '18px', borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: 'pointer' },
  callBtn: { display: 'block', background: '#1e293b', color: '#fff', textDecoration: 'none', padding: '18px', borderRadius: '16px', fontWeight: 'bold', fontSize: '18px' },
  prevBtn: { background: '#e2e8f0', color: '#475569', border: 'none', padding: '18px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', width: '80px' },
};