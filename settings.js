    const buttons = document.querySelectorAll("ion-tab-button");
    const pages = document.querySelectorAll(".page");

    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("tab");

        // 隱藏所有頁面
        pages.forEach(p => p.classList.remove("active"));
        // 顯示對應頁面
        document.getElementById(target).classList.add("active");
      });
    });