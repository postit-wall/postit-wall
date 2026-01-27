/* Firebase - 반드시 전체 URL(https://...)을 사용해야 에러가 나지 않습니다 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtEtTKT_ay0KZoNw6kxiWt_RkI6L2UvKQ",
  authDomain: "postit-wall-7ba23.firebaseapp.com",
  projectId: "postit-wall-7ba23",
  storageBucket: "postit-wall-7ba23.appspot.com",
  messagingSenderId: "447459662497",
  appId: "1:447459662497:web:73ebd7b62d08ca6f12aee0",
  measurementId: "G-22QZE2KBN3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const ADMIN_CODE = "87524";

/* DOM 요소 - DOMContentLoaded 이후에 안전하게 가져오기 위해 함수 내부에 배치하거나 리스너 사용 */
document.addEventListener("DOMContentLoaded", () => {
  const board = document.getElementById("board");
  const modal = document.getElementById("modal");
  const addBtn = document.getElementById("addPostitBtn");
  const saveBtn = document.getElementById("savePostit");

  /* 유틸 */
  const rand = (min, max) => Math.random() * (max - min) + min;

  /* 모달 열기/닫기 */
  if (addBtn) {
    addBtn.onclick = () => {
      modal.style.display = "block";
    };
  }

  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) modal.style.display = "none";
    };
  }

  /* 포스트잇 생성 함수 */
  function createPostit(data, id) {
    const el = document.createElement("div");
    el.className = "postit";
    el.style.background = data.color;
    el.style.fontFamily = data.font;
    el.style.width = data.size + "px";
    el.style.height = data.size + "px";
    el.style.left = data.x + "px";
    el.style.top = data.y + "px";
    el.style.transform = `rotate(${data.rotate}deg)`;
    el.innerText = data.text;

    const trash = document.createElement("span");
    trash.className = "trash";
    trash.textContent = "🗑️";
    el.appendChild(trash);

    trash.onclick = async (e) => {
      e.stopPropagation();
      const pw = prompt("비밀번호 입력");
      if (pw === data.password || pw === ADMIN_CODE) {
        await deleteDoc(doc(db, "notes", id)); // 컬렉션 명 "notes"로 통일
        el.remove();
      } else {
        alert("비밀번호가 틀렸어요");
      }
    };
    board.appendChild(el);
  }

  /* 불러오기 */
  async function load() {
    board.innerHTML = "";
    const snap = await getDocs(collection(db, "notes"));
    snap.forEach(d => createPostit(d.data(), d.id));
  }

  /* 저장 버튼 클릭 */
  if (saveBtn) {
    saveBtn.onclick = async () => {
      const text = document.getElementById("textInput").value.trim();
      const color = document.getElementById("colorInput").value;
      const font = document.getElementById("fontInput").value;
      const password = document.getElementById("passwordInput").value;

      if (!text || password.length !== 4) {
        alert("글과 4자리 비밀번호 필요");
        return;
      }

      const size = 160 + Math.max(0, text.length - 40) * 2;
      const rect = board.getBoundingClientRect();

      await addDoc(collection(db, "notes"), {
        text, color, font, password, size,
        x: rand(20, rect.width - size - 20),
        y: rand(20, rect.height - size - 20),
        rotate: rand(-10, 10),
        createdAt: Date.now()
      });

      modal.style.display = "none";
      document.getElementById("textInput").value = "";
      document.getElementById("passwordInput").value = "";
      load();
    };
  }

  /* 최초 실행 */
  load();
});
