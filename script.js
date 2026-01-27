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

// 이미 있는 모든 포스트잇 면적과 대조하여 겹치는지 확인
function isColliding(x, y) {
    const items = document.querySelectorAll('.postit');
    for (let p of items) {
        const px = parseFloat(p.style.left);
        const py = parseFloat(p.style.top);
        // 사각형 면적 충돌 판정 (여유 공간 10px)
        if (!(x + SIZE + 10 < px || x > px + SIZE + 10 || y + SIZE + 10 < py || y > py + SIZE + 10)) {
            return true; 
        }
    }
    return false;
}

// 왼쪽 상단부터 빈틈 수색
function getSpot() {
    const winW = window.innerWidth;
    for (let y = 20; y < 10000; y += 30) {
        for (let x = 10; x < winW - SIZE - 10; x += 30) {
            if (!isColliding(x, y)) return { x, y };
        }
    }
    return { x: 20, y: 20 };
}

function render(data, id) {
    if (document.getElementById(id)) return;
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
    trash.onclick = async () => {
        if (prompt("비번") === data.password || prompt("관리자") === "87524") {
            await deleteDoc(doc(db, "notes", id));
            el.remove();
        }
    };
    el.appendChild(trash);
    document.getElementById('board').appendChild(el);
}

async function load() {
    const snap = await getDocs(query(collection(db, "notes"), orderBy("createdAt", "asc")));
    snap.forEach(d => render(d.data(), d.id));
}

document.getElementById('addPostitBtn').onclick = () => document.getElementById('modal').style.display = 'block';
document.getElementById('modal').onclick = (e) => { if(e.target.id === 'modal') e.target.style.display = 'none'; };

document.getElementById('savePostit').onclick = async () => {
    const text = document.getElementById('textInput').value;
    const password = document.getElementById('passwordInput').value;
    if(!text || password.length < 4) return alert("내용과 비번 4자리 확인!");

    const pos = getSpot();
    const docData = {
        text, password, x: pos.x, y: pos.y,
        color: document.getElementById('colorInput').value,
        rotate: Math.random() * 6 - 3,
        createdAt: Date.now()
    };
    const docRef = await addDoc(collection(db, "notes"), docData);
    render(docData, docRef.id);
    document.getElementById('modal').style.display = 'none';
    document.getElementById('textInput').value = '';
};

load();
