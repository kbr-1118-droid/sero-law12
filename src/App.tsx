import { useState } from 'react';

// 1. 보내주신 최신 URL 반영
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwn9BJwkKcavmW5tlJYWkllYCYxUZyxLqaHKxYBS5w5GG_CRUaGLKV9ghul1tiWK43H/exec'; 
const FORM_SPREE_URL = 'https://formspree.io/f/xvzbjvdr'; 

type Screen = 'intro' | 'step1' | 'step2' | 'result' | 'done';

export default function App() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    marital: '미혼', childrenCount: 0, parentsCount: 0,
    income: '', assets: '', debt: '',
    contactName: '', contactPhone: '', callTime: '언제든 가능'
  });
  const [diagnosis, setDiagnosis] = useState({ type: '', desc: '', color: '' });

  const formatComma = (val: string) => val.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const unformat = (val: string) => Number(val.replace(/,/g, ''));
  const toKoreanAmount = (num: number) => {
    if (!num) return '';
    const eok = Math.floor(num / 100000000);
    const man = Math.floor((num % 100000000) / 10000);
    return `${eok > 0 ? eok + '억 ' : ''}${man > 0 ? man + '만 ' : ''}원`;
  };

  const updateFormData = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

  const runDiagnosis = () => {
    const inc = unformat(formData.income);
    const dbt = unformat(formData.debt);
    const ast = unformat(formData.assets);
    const household = 1 + (formData.marital === '결혼' ? 0.5 : 0) + formData.childrenCount + formData.parentsCount;
    const liveCost = 1330000 * (household * 0.85);

    let res = { type: '개인회생 집중 진단', desc: '현재 소득과 채무 구조상 법원을 통한 원금 탕감 가능성이 매우 높습니다.', color: '#2563eb' };
    if (inc < liveCost) {
      res = { type: '개인파산/면책 검토', desc: '수입 대비 생계비 부담이 커서 원금 전액 면책이 가능한 파산 절차가 유리할 수 있습니다.', color: '#dc2626' };
    } else if (ast >= dbt) {
      res = { type: '신용회복/워크아웃', desc: '보유 재산이 채무보다 많아 회생 기각 우려가 있으니 이자 감면 제도를 우선 추천합니다.', color: '#059669' };
    }
    setDiagnosis(res);
    setScreen('result');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const payload = {
      ...formData,
      income: formatComma(formData.income) + "원",
      debt: formatComma(formData.debt) + "원",
      assets: formatComma(formData.assets) + "원",
      ...diagnosis,
      유입경로: "하이브_새로회생_자가진단",
      접수일시: new Date().toLocaleString('ko-KR')
    };

    try {
      // 구글 시트 전송 (항목 매칭)
      fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      // 이메일 알림 전송
      const res = await fetch(FORM_SPREE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) setScreen('done');
    } catch (e) { alert('오류가 발생했습니다.'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div style={styles.container}>
      {screen === 'intro' && (
        <div style={styles.screen}>
          <div style={{textAlign:'center'}}><span style={styles.badge}>법무법인 하이브 새로회생센터</span></div>
          <h1 style={styles.mainTitle}>지긋지긋한 채무,<br/><span style={{color: '#2563eb'}}>나의 해결책은?</span></h1>
          <p style={styles.subTitle}>변호사가 검토하는 2026 최신 기준 리포트.<br/><b>신청해주시면 순차적으로 연락드립니다.</b></p>
          <div style={styles.trustBox}>
            <div style={styles.trustItem}>✅ <b>광주회생법원</b> 최신 판례 실시간 반영</div>
            <div style={styles.trustItem}>✅ <b>신속 상담</b> 신청 순서대로 빠른 연락</div>
            <div style={styles.trustItem}>✅ <b>비밀보장</b> 가족/직장 모르게 철저 보안</div>
          </div>
          <button style={styles.mainBtn} onClick={() => setScreen('step1')}>무료 자가진단 시작하기</button>
          <div style={{textAlign:'center', color:'#64748b', fontSize:'14px', fontWeight:'bold'}}>대표번호: 📞 1551-7473</div>
        </div>
      )}

      {screen === 'step1' && (
        <div style={styles.screen}>
          <h2 style={styles.stepTitle}>1. 가구 및 부양 상황</h2>
          <div style={styles.inputGroup}>
            <label style={styles.label}>결혼 형태</label>
            <div style={styles.grid}>
              {['미혼', '결혼', '기타'].map(v => (
                <button key={v} onClick={() => updateFormData('marital', v)} 
                  style={formData.marital === v ? styles.selectBtnActive : styles.selectBtn}>{v}</button>
              ))}
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>부양가족 수 (미성년 자녀/부모님)</label>
            <input type="number" inputMode="numeric" style={styles.input} placeholder="0" onChange={e => updateFormData('childrenCount', Number(e.target.value))} />
          </div>
          <button style={styles.mainBtn} onClick={() => setScreen('step2')}>다음 단계로</button>
        </div>
      )}

      {screen === 'step2' && (
        <div style={styles.screen}>
          <h2 style={styles.stepTitle}>2. 경제 상황 진단</h2>
          <div style={styles.inputGroup}>
            <label style={styles.label}>월 평균 수입 (실수령액)</label>
            <div style={{position:'relative'}}><input type="text" inputMode="numeric" style={styles.input} value={formatComma(formData.income)} onChange={e => updateFormData('income', e.target.value.replace(/\D/g, ''))} /><span style={styles.unitText}>원</span></div>
            <div style={styles.kAmtLabel}>{toKoreanAmount(unformat(formData.income))}</div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>총 채무 원금 합계</label>
            <div style={{position:'relative'}}><input type="text" inputMode="numeric" style={styles.input} value={formatComma(formData.debt)} onChange={e => updateFormData('debt', e.target.value.replace(/\D/g, ''))} /><span style={styles.unitText}>원</span></div>
            <div style={styles.kAmtLabel}>{toKoreanAmount(unformat(formData.debt))}</div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>보유 재산 가액 (담보대출 제외)</label>
            <div style={{position:'relative'}}><input type="text" inputMode="numeric" style={styles.input} value={formatComma(formData.assets)} onChange={e => updateFormData('assets', e.target.value.replace(/\D/g, ''))} /><span style={styles.unitText}>원</span></div>
            <div style={styles.kAmtLabel}>{toKoreanAmount(unformat(formData.assets))}</div>
          </div>
          <button style={styles.mainBtn} onClick={runDiagnosis}>진단 리포트 생성</button>
        </div>
      )}

      {screen === 'result' && (
        <div style={styles.screen}>
          <div style={styles.resultCard}>
            <h2 style={{...styles.resTitle, color: diagnosis.color}}>{diagnosis.type}</h2>
            <div style={styles.resDesc}>{diagnosis.desc}</div>
          </div>
          <div style={styles.formCard}>
            <h4 style={styles.formTitle}>📋 상세 분석 리포트 신청</h4>
            <input type="text" placeholder="성함" style={styles.input} onChange={e => updateFormData('contactName', e.target.value)} />
            <input type="tel" placeholder="연락처" style={styles.input} onChange={e => updateFormData('contactPhone', e.target.value)} />
            <select style={styles.selectInput} onChange={e => updateFormData('callTime', e.target.value)}>
              <option value="언제든 가능">희망 상담 시간: 언제든</option>
              <option value="오전 (09~12시)">오전 (09~12시)</option>
              <option value="점심 (12~13시)">점심 시간 활용</option>
              <option value="오후 (13~18시)">오후 (13~18시)</option>
            </select>
            <button style={styles.submitBtn} onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? '전송 중...' : '무료 리포트 신청'}</button>
          </div>
          <p style={{textAlign:'center', fontSize:'12px', color:'#94a3b8'}}>🔒 모든 정보는 법률에 의해 비밀이 보장됩니다.</p>
        </div>
      )}

      {screen === 'done' && (
        <div style={{...styles.screen, textAlign:'center', justifyContent:'center'}}>
          <div style={{fontSize:'70px'}}>🎉</div>
          <h2>신청이 완료되었습니다.</h2>
          <p style={{color:'#64748b', lineHeight:'1.7'}}>
            하이브 새로회생 전문팀이 곧 연락드리겠습니다.<br/>
            <b>담당자가 순차적으로 연락드리겠습니다.</b>
          </p>
          <div style={{marginTop:'20px'}}>
             <p style={{fontSize:'13px', color:'#94a3b8', marginBottom:'10px'}}>기다리기 어려우시다면?</p>
             <a href="tel:1551-7473" style={styles.callBtn}>📞 1551-7473 즉시 연결</a>
          </div>
          <button style={{...styles.mainBtn, marginTop: '20px', background: '#f1f5f9', color: '#475569'}} onClick={() => setScreen('intro')}>처음으로 돌아가기</button>
        </div>
      )}
    </div>
  );
}

const styles: any = {
  container: { maxWidth: '480px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Pretendard, sans-serif' },
  screen: { padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '24px' },
  badge: { background: '#e2e8f0', color: '#475569', padding: '6px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: '800' },
  mainTitle: { fontSize: '32px', fontWeight: '900', color: '#0f172a', lineHeight: '1.2' },
  subTitle: { fontSize: '16px', color: '#64748b', lineHeight: '1.5' },
  trustBox: { display: 'flex', flexDirection: 'column', gap: '8px', background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' },
  trustItem: { fontSize: '14px', color: '#334155' },
  mainBtn: { background: '#2563eb', color: '#fff', border: 'none', padding: '20px', borderRadius: '16px', fontSize: '18px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)' },
  stepTitle: { fontSize: '22px', fontWeight: '800', color: '#1e293b' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '14px', fontWeight: '700', color: '#475569' },
  input: { width: '100%', padding: '18px', borderRadius: '14px', border: '2px solid #e2e8f0', fontSize: '17px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#1e293b' },
  unitText: { position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: '#94a3b8' },
  kAmtLabel: { textAlign: 'right', fontSize: '13px', color: '#2563eb', fontWeight: '800' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' },
  selectBtn: { padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff', fontWeight: '700' },
  selectBtnActive: { padding: '16px', borderRadius: '12px', border: '2px solid #2563eb', background: '#eff6ff', color: '#2563eb', fontWeight: '900' },
  resultCard: { background: '#fff', padding: '30px', borderRadius: '28px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
  resTitle: { fontSize: '26px', fontWeight: '900', margin: '15px 0' },
  resDesc: { background: '#f8fafc', padding: '20px', borderRadius: '16px', color: '#334155', fontSize: '15px', lineHeight: '1.6' },
  formCard: { background: '#1e293b', padding: '28px', borderRadius: '28px', display: 'flex', flexDirection: 'column', gap: '12px' },
  formTitle: { color: '#fbbf24', fontSize: '20px', fontWeight: '900', textAlign: 'center' },
  selectInput: { padding: '16px', borderRadius: '14px', fontSize: '15px', border: 'none', background: '#fff' },
  submitBtn: { background: '#fbbf24', color: '#1e293b', border: 'none', padding: '18px', borderRadius: '14px', fontSize: '16px', fontWeight: '900', marginTop: '10px' },
  callBtn: { display: 'block', background: '#1e293b', color: '#fff', textDecoration: 'none', padding: '18px', borderRadius: '16px', fontWeight: 'bold', fontSize: '18px' }
};
