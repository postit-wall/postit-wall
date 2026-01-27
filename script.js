import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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
const SIZE = 160;
const MARGIN = 20;

// 면적 겹침 체크 함수
function checkOverlap(x, y) {
    const postits = document.querySelectorAll('.postit');
    for (let p of postits) {
        const px = parseFloat(p.style.left);
        const py = parseFloat(p.style.top);
        // AABB 충돌 판정 알고리즘
        if (!(x + SIZE + MARGIN < px || x > px + SIZE + MARGIN || y + SIZE + MARGIN < py || y > py + SIZE + MARGIN)) {
            return true;
        }
    }
    return false;
}

// 최적의 빈자리 탐색 로직
function findSpot() {
    const winW = window.innerWidth;
    // 세로로 무한히 스캔 (배경이 따라오므로 안전)
    for (let y = 30; y < 20000; y += 40) {
        for (let x = 20; x < winW - SIZE - 20; x += 40) {
            if (!checkOverlap(x, y)) return { x, y };
        }
    }
    return { x: 30, y: 30 };
}

function render(data, id) {
    if (document.getElementById(id)) return;
    const board = document.getElementById('board');
    const el = document.createElement('div');
    el.className = 'postit';
    el.id = id;
    
    // DB 데이터 반영
    el.style.left = `${data.x}px`;
    el.style.top = `${data.y}px`;
    el.style.backgroundColor = data.color;
    // 사용자가 선택한 글꼴 적용
    el.style.fontFamily = data.font || "'Nanum Pen Script', cursive";
    el.style.transform = `rotate(${data.rotate || 0}deg)`;
    el.innerText = data.text;

    // 쓰레기통 아이콘 생성
    const trash = document.createElement('span');
    trash.className = 'trash'; trash.innerHTML = '🗑️';
    trash.onclick = async (e) => {
        e.stopPropagation();
        const pw = prompt("삭제 비밀번호를 입력하세요.");
        if (pw === data.password || pw === "87524") {
            await deleteDoc(doc(db, "notes", id));
            el.remove();
        }
    };
    el.appendChild(trash);
    board.appendChild(el);
}

async function load() {
    const q = query(collection(db, "notes"), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    snap.forEach(d => render(d.data(), d.id));
}

// UI 컨트롤러
const modal = document.getElementById('modal');
document.getElementById('addPostitBtn').onclick = () => modal.style.display = 'block';
modal.onclick = (e) => { if(e.target === modal) modal.style.display = 'none'; };

document.getElementById('savePostit').onclick = async () => {
    const text = document.getElementById('textInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const font = document.getElementById('fontInput').value; // 폰트 값
    const color = document.getElementById('colorInput').value;

    if(!text || password.length < 4) return alert("내용과 비밀번호 4자리를 입력해주세요.");

    const pos = findSpot();
    const docData = {
        text, password, font, color,
        x: pos.x, y: pos.y,
        rotate: (Math.random() * 6 - 3), // 약간의 회전으로 자연스럽게
        createdAt: Date.now()
    };
    
    const docRef = await addDoc(collection(db, "notes"), docData);
    render(docData, docRef.id);
    modal.style.display = 'none';
    document.getElementById('textInput').value = '';
    document.getElementById('passwordInput').value = '';
};

load();
