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
const MARGIN = 15;

function isOccupied(x, y) {
    const postits = document.querySelectorAll('.postit');
    for (let p of postits) {
        const px = parseFloat(p.style.left);
        const py = parseFloat(p.style.top);
        const overlap = !(x + SIZE + MARGIN < px || x > px + SIZE + MARGIN || y + SIZE + MARGIN < py || y > py + SIZE + MARGIN);
        if (overlap) return true;
    }
    return false;
}

function findNaturalSpot() {
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    for (let i = 0; i < 50; i++) {
        let x = Math.floor(Math.random() * (winW - SIZE - 40)) + 20;
        let y = Math.floor(Math.random() * (winH - SIZE - 40)) + 20;
        if (!isOccupied(x, y)) return { x, y };
    }
    for (let y = 30; y < 10000; y += 40) {
        for (let x = 20; x < winW - SIZE - 20; x += 40) {
            let jX = x + (Math.random() * 20 - 10);
            let jY = y + (Math.random() * 20 - 10);
            if (!isOccupied(jX, jY)) return { x: jX, y: jY };
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
    el.style.left = `${data.x}px`;
    el.style.top = `${data.y}px`;
    el.style.backgroundColor = data.color;
    
    // 수정됨: 글꼴 데이터가 없으면 '기본 고딕체'를 우선 적용
    el.style.fontFamily = data.font || "'Pretendard', -apple-system, sans-serif";
    
    el.style.transform = `rotate(${data.rotate || 0}deg)`;
    el.innerText = data.text;

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

async function load() {
    const q = query(collection(db, "notes"), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    snap.forEach(d => render(d.data(), d.id));
}

const modal = document.getElementById('modal');
document.getElementById('addPostitBtn').onclick = () => modal.style.display = 'block';
window.onclick = (e) => { if(e.target === modal) modal.style.display = 'none'; };

document.getElementById('savePostit').onclick = async () => {
    const text = document.getElementById('textInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const font = document.getElementById('fontInput').value;
    const color = document.getElementById('colorInput').value;

    if(!text || password.length < 4) return alert("내용과 비밀번호 4자리를 모두 입력해주세요.");

    const pos = findNaturalSpot();
    const docData = {
        text, password, font, color,
        x: pos.x, y: pos.y,
        rotate: (Math.random() * 12 - 6),
        createdAt: Date.now()
    };
    
    try {
        const docRef = await addDoc(collection(db, "notes"), docData);
        render(docData, docRef.id);
        modal.style.display = 'none';
        document.getElementById('textInput').value = '';
        document.getElementById('passwordInput').value = '';
    } catch (e) { console.error(e); }
};

load();
