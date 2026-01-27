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
const SIZE = 160; // 포스트잇 크기

// 1. 겹침 감지 알고리즘 (사각형 면적 대조)
function isColliding(x, y) {
    const postits = document.querySelectorAll('.postit');
    for (let p of postits) {
        const px = parseFloat(p.style.left);
        const py = parseFloat(p.style.top);
        
        // 두 사각형이 겹치는지 확인 (여백 10px 포함)
        const overlap = !(
            x + SIZE + 10 < px || 
            x > px + SIZE + 10 || 
            y + SIZE + 10 < py || 
            y > py + SIZE + 10
        );
        if (overlap) return true;
    }
    return false;
}

// 2. 비어있는 좌표 찾기
function findEmptySpot() {
    const winW = window.innerWidth;
    // 상단부터 아래로 훑으며 빈 공간 수색
    for (let y = 20; y < 10000; y += 40) {
        for (let x = 10; x < winW - SIZE - 10; x += 40) {
            if (!isColliding(x, y)) return { x, y };
        }
    }
    return { x: 20, y: 20 };
}

// 3. 화면에 포스트잇 그리기
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
        const pw = prompt("비밀번호 4자리");
        if (pw === data.password || pw === "87524") {
            await deleteDoc(doc(db, "notes", id));
            el.remove();
        }
    };
    el.appendChild(trash);
    board.appendChild(el);
}

// 4. 데이터 불러오기
async function load() {
    const q = query(collection(db, "notes"), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    snap.forEach(d => render(d.data(), d.id));
}

// 이벤트 리스너
document.getElementById('addPostitBtn').onclick = () => document.getElementById('modal').style.display = 'block';
document.getElementById('modal').onclick = (e) => { if(e.target.id === 'modal') e.target.style.display = 'none'; };

document.getElementById('savePostit').onclick = async () => {
    const text = document.getElementById('textInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    if(!text || password.length < 4) return alert("내용과 비번 4자리를 확인해주세요!");

    const pos = findEmptySpot();
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
