import React, { useState } from 'react';

// ===== 설정값 =====
// ⚠️ 중요: 새 구글 시트를 생성했다면, 확장 프로그램 > Apps Script에서 새 스크립트를 배포하고 URL을 교체해야 합니다.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwLOdMcY_A1qe6Ud2eqULEkd-_eyaik5Emh0iSm9BvkX4UQl_4ZFJEUtBih9_oGnbMg/exec';
const CLOUDINARY_CLOUD_NAME = 'deyljykwb';
// ⚠️ 중요: Cloudinary 설정 > Upload > Upload presets > 'yucylwb1' 편집 > Access Mode를 'Public'으로 설정해야 링크가 열립니다.
const CLOUDINARY_UPLOAD_PRESET = 'yucylwb1';
// ==================

type Screen = 'intro' | 'step0' | 'step1' | 'step2' | 'result' | 'done';

export default function App() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [marital, setMarital] = useState('미혼');
  const [childrenCount, setChildrenCount] = useState(''); // 문자열로 변경하여 빈 값 허용
  const [income, setIncome] = useState('');
  const [debt, setDebt] = useState('');
  const [assets, setAssets] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [managerName, setManagerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [callTime, setCallTime] = useState('언제든 가능');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false); // 드래그 상태
  const [diagnosis, setDiagnosis] = useState({ type: '', desc: '', color: '' });

  const fmt = (val: string) =>
    val.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const num = (val: string) => Number(val.replace(/,/g, ''));
  const krw = (n: number) => {
    if (!n) return '';
    const eok = Math.floor(n / 100000000);
    const man = Math.floor((n % 100000000) / 10000);
    return `${eok > 0 ? eok + '억 ' : ''}${man > 0 ? man + '만 ' : ''}원`;
  };

  // 파일 선택 핸들러
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

  // 드래그 앤 드롭 핸들러
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const body = new FormData();
    body.append('file', file);
    body.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    body.append('folder', 'saero_nice');
    // PDF 등 문서 파일도 올바르게 처리되도록 resource_type 자동 감지
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

    const inc = num(income);
    const dbt = num(debt) * 10000;
    const ast = num(assets) * 10000;

    let res = {
      type: '개인회생 집중 진단',
      desc: '현재 소득과 채무 구조상 법원을 통한 원금 탕감 가능성이 매우 높습니다.',
      color: '#2563eb',
    };
    if (inc < 1330000) {
      res = {
        type: '개인파산/면책 검토',
        desc: '수입 대비 생계비 부담이 커서 원금 전액 면책이 가능한 파산 절차가 유리할 수 있습니다.',
        color: '#dc2626',
      };
    } else if (ast >= dbt) {
      res = {
        type: '신용회복/워크아웃',
        desc: '보유 재산이 채무보다 많아 회생 기각 우려가 있으니 이자 감면 제도를 우선 추천합니다.',
        color: '#059669',
      };
    } else if (dbt < 15000000) {
      res = {
        type: '신용회복/워크아웃 유리',
        desc: '채무액이 1,500만원 이하인 경우 회생 비용 대비 실익이 적을 수 있어 신용회복위원회 절차가 더 유리할 수 있습니다.',
        color: '#059669',
      };
    }
    setDiagnosis(res);
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
      // 1. Cloudinary 파일 업로드
      let niceUrl = '첨부없음';
      if (attachedFile) {
        try {
          niceUrl = await uploadToCloudinary(attachedFile);
        } catch {
          niceUrl = '업로드실패';
        }
      }

      // 2. 구글 시트 전송
      const payload = {
        "접수일시": new Date().toLocaleString('ko-KR'),
        "성함": contactName,
        "연락처": contactPhone,
        "희망상담시간": callTime,
        "결혼여부": marital,
        "월수입": fmt(income) + '원',
        "총채무": fmt(debt) + '만원',
        "재산가치": fmt(assets) + '만원',
        "부양가족": (childrenCount || '0') + '명',
        "진단결과": diagnosis.type,
        "NICE신용정보": niceUrl,
        "나이스정보": niceUrl, // 추가: 헤더 호환성용
        "niceFile": niceUrl,   // 추가: 레거시 호환성용
        "담당자": managerName,
        "유입경로": companyName,
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

      {/* 담당자 정보 입력 (Step 0) */}
      {screen === 'step0' && (
        <div style={s.screen}>
          <h2 style={s.stepTitle}>담당자 정보 입력</h2>
          <div style={s.group}>
            <label style={s.label}>담당자 성함</label>
            <input
              type="text"
              style={s.input}
              placeholder="담당자 성함을 입력하세요"
              value={managerName}
              onChange={e => setManagerName(e.target.value)}
            />
          </div>
          <div style={s.group}>
            <label style={s.label}>회사명</label>
            <input
              type="text"
              style={s.input}
              placeholder="회사명을 입력하세요"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={s.prevBtn} onClick={() => setScreen('intro')}>이전</button>
            <button style={{ ...s.mainBtn, flex: 1 }} onClick={() => {
              if (!managerName || !companyName) {
                alert('담당자 성함과 회사명을 모두 입력해주세요.');
                return;
              }
              setScreen('step1');
            }}>
              다음 단계로
            </button>
          </div>
        </div>
      )}

      {/* 1단계 */}
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
            <input
              type="number" inputMode="numeric" min="0"
              style={s.input} placeholder="0"
              value={childrenCount}
              onChange={e => setChildrenCount(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={s.prevBtn} onClick={() => setScreen('step0')}>이전</button>
            <button style={{ ...s.mainBtn, flex: 1 }} onClick={() => setScreen('step2')}>
              다음 단계로
            </button>
          </div>
        </div>
      )}

      {/* 2단계 */}
      {screen === 'step2' && (
        <div style={s.screen}>
          <h2 style={s.stepTitle}>2. 경제 상황 진단</h2>
          <div style={s.group}>
            <label style={s.label}>월 평균 수입 (실수령액)</label>
            <div style={{ position: 'relative' }}>
              <input type="text" inputMode="numeric" style={s.input}
                value={fmt(income)}
                onChange={e => setIncome(e.target.value.replace(/\D/g, ''))} />
              <span style={s.unit}>원</span>
            </div>
            <div style={s.krw}>{krw(num(income))}</div>
          </div>
          <div style={s.group}>
            <label style={s.label}>총 채무 원금 합계 (만원 단위)</label>
            <div style={{ position: 'relative' }}>
              <input type="text" inputMode="numeric" style={s.input}
                value={fmt(debt)}
                onChange={e => setDebt(e.target.value.replace(/\D/g, ''))} />
              <span style={s.unit}>만원</span>
            </div>
            <div style={s.krw}>{krw(num(debt) * 10000)}</div>
          </div>
          <div style={s.group}>
            <label style={s.label}>보유 재산 가액 (만원 단위)</label>
            <div style={{ position: 'relative' }}>
              <input type="text" inputMode="numeric" style={s.input}
                value={fmt(assets)}
                onChange={e => setAssets(e.target.value.replace(/\D/g, ''))} />
              <span style={s.unit}>만원</span>
            </div>
            <div style={s.krw}>{krw(num(assets) * 10000)}</div>
          </div>
          <div style={s.group}>
            <label style={s.label}>NICE 신용정보 첨부 (필수)</label>
            
            {/* 드래그 앤 드롭 영역 */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              style={{
                ...s.input,
                padding: '20px',
                textAlign: 'center',
                border: isDragging ? '2px dashed #2563eb' : '2px dashed #cbd5e1',
                background: isDragging ? '#eff6ff' : '#fff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <input
                id="fileInput"
                type="file"
                accept="image/*,.pdf"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div style={{ fontSize: '24px' }}>📂</div>
              <div style={{ fontSize: '14px', color: '#475569', fontWeight: 'bold' }}>
                {attachedFile ? (
                  <span style={{ color: '#2563eb' }}>✅ {attachedFile.name}</span>
                ) : (
                  <>
                    클릭하거나 파일을 여기로 드래그하세요<br />
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'normal' }}>
                      (이미지, PDF / 10MB 이하)
                    </span>
                  </>
                )}
              </div>
            </div>

          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={s.prevBtn} onClick={() => setScreen('step1')}>이전</button>
            <button style={{ ...s.mainBtn, flex: 1 }} onClick={runDiagnosis}>
              진단 리포트 생성
            </button>
          </div>
        </div>
      )}

      {/* 결과 */}
      {screen === 'result' && (
        <div style={s.screen}>
          <div style={s.resultCard}>
            <h2 style={{ ...s.resTitle, color: diagnosis.color }}>{diagnosis.type}</h2>
            <div style={s.resDesc}>{diagnosis.desc}</div>
          </div>
          <div style={s.formCard}>
            <h4 style={s.formTitle}>📋 상세 분석 리포트 신청</h4>
            <input type="text" placeholder="성함" style={s.input}
              value={contactName}
              onChange={e => setContactName(e.target.value)} />
            <input type="tel" placeholder="연락처 (숫자만)" style={s.input}
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)} />
            <select style={s.selectInput}
              value={callTime}
              onChange={e => setCallTime(e.target.value)}>
              <option value="언제든 가능">희망 상담 시간: 언제든</option>
              <option value="오전 (09~12시)">오전 (09~12시)</option>
              <option value="점심 (12~13시)">점심 시간 활용</option>
              <option value="오후 (13~18시)">오후 (13~18시)</option>
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={s.prevBtn} onClick={() => setScreen('step2')}>이전</button>
              <button
                style={{ ...s.submitBtn, flex: 1, marginTop: 0, opacity: isSubmitting ? 0.7 : 1 }}
                onClick={handleSubmit}
                disabled={isSubmitting}>
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
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '10px' }}>
              기다리기 어려우시다면?
            </p>
            <a href="tel:1551-7473" style={s.callBtn}>📞 1551-7473 즉시 연결</a>
          </div>
          <button
            style={{ ...s.mainBtn, marginTop: '20px', background: '#f1f5f9', color: '#475569' }}
            onClick={() => {
              setScreen('intro');
              setIncome(''); setDebt(''); setAssets('');
              setContactName(''); setContactPhone('');
              setManagerName(''); setCompanyName('');
              setAttachedFile(null);
              setMarital('미혼'); setChildrenCount(''); // 초기화 시 빈 문자열
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
  resultCard: { background: '#fff', padding: '30px', borderRadius: '28px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
  resTitle: { fontSize: '26px', fontWeight: '900', margin: '15px 0' },
  resDesc: { background: '#f8fafc', padding: '20px', borderRadius: '16px', color: '#334155', fontSize: '15px', lineHeight: '1.6' },
  formCard: { background: '#1e293b', padding: '28px', borderRadius: '28px', display: 'flex', flexDirection: 'column', gap: '12px' },
  formTitle: { color: '#fbbf24', fontSize: '20px', fontWeight: '900', textAlign: 'center' },
  selectInput: { padding: '16px', borderRadius: '14px', fontSize: '15px', border: 'none', background: '#fff' },
  submitBtn: { background: '#fbbf24', color: '#1e293b', border: 'none', padding: '18px', borderRadius: '14px', fontSize: '16px', fontWeight: '900', cursor: 'pointer' },
  callBtn: { display: 'block', background: '#1e293b', color: '#fff', textDecoration: 'none', padding: '18px', borderRadius: '16px', fontWeight: 'bold', fontSize: '18px' },
  prevBtn: { background: '#e2e8f0', color: '#475569', border: 'none', padding: '18px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', width: '80px' },
};
