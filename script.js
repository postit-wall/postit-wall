import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// 1. Firebase 설정 (사용자님의 설정값 유지)
const firebaseConfig = {
    apiKey: "AIzaSyCtEtTKT_ay0KZoNw6kxiWt_RkI6L2UvKQ",
    authDomain: "postit-wall-7ba23.firebaseapp.com",
    projectId: "postit-wall-7ba23",
    storageBucket: "postit-wall-7ba23.appspot.com",
    messagingSenderId: "447459662497",
    appId: "1:447459662497:web:73ebd7b62d08ca6f12aee0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const SIZE = 160; // 포스트잇 가로세로 크기
const MARGIN = 15; // 포스트잇 간 최소 간격

// 2. 겹침 감지 (AABB 충돌 판정)
function isOccupied(x, y) {
    const postits = document.querySelectorAll('.postit');
    for (let p of postits) {
        const px = parseFloat(p.style.left);
        const py = parseFloat(p.style.top);
        
        // 사각형 면적이 겹치는지 수학적으로 계산
        const overlap = !(
            x + SIZE + MARGIN < px || 
            x > px + SIZE + MARGIN || 
            y + SIZE + MARGIN < py || 
            y > py + SIZE + MARGIN
        );
        if (overlap) return true;
    }
    return false;
}

// 3. 랜덤 + 순차 하이브리드 빈자리 탐색
function findNaturalSpot() {
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    // 단계 1: 화면 내에서 랜덤하게 50번 시도 (자연스러운 배치 유도)
    for (let i = 0; i < 50; i++) {
        let x = Math.floor(Math.random() * (winW - SIZE - 40)) + 20;
        let y = Math.floor(Math.random() * (winH - SIZE - 40)) + 20;
        if (!isOccupied(x, y)) return { x, y };
    }

    // 단계 2: 자리가 없으면 위에서부터 아래로 빈틈 수색 (보드 확장 대응)
    for (let y = 30; y < 10000; y += 40) {
        for (let x = 20; x < winW - SIZE - 20; x += 40) {
            // 순차 수색 중에도 약간의 오차(Jitter)를 주어 딱딱함을 방지
            let jX = x + (Math.random() * 20 - 10);
            let jY = y + (Math.random() * 20 - 10);
            if (!isOccupied(jX, jY)) return { x: jX, y: jY };
        }
    }
    return { x: 30, y: 30 };
}

// 4. 화면 렌더링 함수
function render(data, id) {
    if (document.getElementById(id)) return;
    const board = document.getElementById('board');
    const el = document.createElement('div');
    el.className = 'postit';
    el.id = id;
    
    // 위치 및 스타일 적용
    el.style.left = `${data.x}px`;
    el.style.top = `${data.y}px`;
    el.style.backgroundColor = data.color;
    
    // 사용자가 선택한 글꼴 적용 (데이터가 없으면 기본 필기체)
    el.style.fontFamily = data.font || "'Nanum Pen Script', cursive";
    
    // 랜덤 회전 (생동감 부여)
    el.style.transform = `rotate(${data.rotate || 0}deg)`;
    el.innerText = data.text;

    // 쓰레기통 아이콘 (CSS에서 hover 시 노출 처리됨)
    const trash = document.createElement('span');
    trash.className = 'trash'; 
    trash.innerHTML = '🗑️';
    trash.onclick = async (e) => {
        e.stopPropagation();
        const pw = prompt("삭제 비밀번호 4자리를 입력하세요.");
        if (pw === data.password || pw === "87524") {
            await deleteDoc(doc(db, "notes", id));
            el.remove();
        }
    };
    el.appendChild(trash);
    board.appendChild(el);
}

// 5. 초기 데이터 로드
async function load() {
    const q = query(collection(db, "notes"), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    snap.forEach(d => render(d.data(), d.id));
}

// 6. 이벤트 리스너 설정
const modal = document.getElementById('modal');
document.getElementById('addPostitBtn').onclick = () => modal.style.display = 'block';

// 모달 바깥 클릭 시 닫기
window.onclick = (e) => { if(e.target === modal) modal.style.display = 'none'; };

// 저장 버튼 클릭
document.getElementById('savePostit').onclick = async () => {
    const text = document.getElementById('textInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const font = document.getElementById('fontInput').value; // HTML의 select 값
    const color = document.getElementById('colorInput').value;

    if(!text || password.length < 4) {
        alert("내용과 비밀번호 4자리를 모두 입력해주세요.");
        return;
    }

    const pos = findNaturalSpot();
    const docData = {
        text, password, font, color,
        x: pos.x,
        y: pos.y,
        rotate: (Math.random() * 12 - 6), // -6도 ~ +6도 사이 랜덤 회전
        createdAt: Date.now()
    };
    
    try {
        const docRef = await addDoc(collection(db, "notes"), docData);
        render(docData, docRef.id);
        modal.style.display = 'none';
        document.getElementById('textInput').value = '';
        document.getElementById('passwordInput').value = '';
    } catch (e) {
        console.error("Error adding document: ", e);
    }
};

load();
