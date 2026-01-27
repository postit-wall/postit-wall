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

// 포스트잇 면적이 다른 포스트잇과 겹치는지 체크
function isOverlapping(x, y) {
    const postits = document.querySelectorAll('.postit');
    for (let p of postits) {
        const px = parseFloat(p.style.left);
        const py = parseFloat(p.style.top);
        // 사각형 충돌 판정 (마진 15px)
        if (!(x + SIZE + 15 < px || x > px + SIZE + 15 || y + SIZE + 15 < py || y > py + SIZE + 15)) {
            return true;
        }
    }
    return false;
}

// 왼쪽 위부터 스캔하며 빈 자리 찾기
function findSpot() {
    const winW = window.innerWidth;
    for (let y = 20; y < 10000; y += 30) {
        for (let x = 10; x < winW - SIZE - 10; x += 30) {
            if (!isOverlapping(x, y)) return { x, y };
        }
    }
    return { x: 20, y: 20 };
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
    el.style.transform = `rotate(${data.rotate || 0}deg)`;
    el.innerText = data.text;

    const trash = document.createElement('span');
    trash.className = 'trash'; trash.innerHTML = '🗑️';
    trash.onclick = async (e) => {
        e.stopPropagation();
        if (prompt("비밀번호") === data.password || prompt("관리자") === "87524") {
            await deleteDoc(doc(db, "notes", id));
            el.remove();
        }
    };
    el.appendChild(trash);
    board.appendChild(el);
}

async function load() {
    const snap = await getDocs(query(collection(db, "notes"), orderBy("createdAt", "asc")));
    snap.forEach(d => render(d.data(), d.id));
}

document.getElementById('addPostitBtn').onclick = () => document.getElementById('modal').style.display = 'block';
document.getElementById('modal').onclick = (e) => { if(e.target.id === 'modal') e.target.style.display = 'none'; };

document.getElementById('savePostit').onclick = async () => {
    const text = document.getElementById('textInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    if(!text || password.length < 4) return alert("내용과 비번 4자리 확인!");

    const pos = findSpot();
    const docData = {
        text, password, x: pos.x, y: pos.y,
        color: document.getElementById('colorInput').value,
        rotate: Math.random() * 8 - 4,
        createdAt: Date.now()
    };
    const docRef = await addDoc(collection(db, "notes"), docData);
    render(docData, docRef.id);
    document.getElementById('modal').style.display = 'none';
    document.getElementById('textInput').value = '';
};

load();
