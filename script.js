document.addEventListener("DOMContentLoaded", () => {
  // --- LÓGICA DE RASTREIO E REPASSE ---
  async function gerenciarRastreio() {
    console.log("Iniciando repasse de UTMs e Tracking Backend...");

    // Função auxiliar para ler os cookies
    function getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(";").shift();
      return null;
    }

    const urlParams = new URLSearchParams(window.location.search);

    // Lista atualizada (incluindo o ctwclid)
    const parametrosDesejados = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      // "url",
      "fbclid",
      "gclid",
      "ctwclid",
    ];

    const parametrosParaRepassar = new URLSearchParams();
    const trackingData = {};
    let temParametro = false;

    parametrosDesejados.forEach((param) => {
      if (urlParams.has(param)) {
        const valor = urlParams.get(param);
        parametrosParaRepassar.append(param, valor);
        trackingData[param] = valor;
        temParametro = true;
      }
    });

    // --- PARTE 1: O REPASSE DE URL (para caso o usuario tenha adblock ou coisa parecida) ---
    const stringParametros = parametrosParaRepassar.toString();
    if (stringParametros) {
      const linksCTA = document.querySelectorAll('a[href*="registrar-se"]');
      linksCTA.forEach((link) => {
        const urlOriginal = link.getAttribute("href");
        const separador = urlOriginal.includes("?") ? "&" : "?";
        link.setAttribute("href", urlOriginal + separador + stringParametros);
      });
    }

    // --- PARTE 2: COMUNICAÇÃO COM O SEU BACKEND FASTAPI (python da cevolu) ---
    // Só dispara se a URL tiver parâmetros E se o usuario já não tiver o UUID salvo
    if (temParametro && !getCookie("visitor_uuid")) {
      try {
        // URL real de produção do backend aqui:
        // const base = "https://api.cevolu.com.br"
        // const base = "http://localhost:8000"

        const response = await fetch(
          "https://api.cevolu.com.br/api/meta-ads/visit",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(trackingData),
          },
        );

        if (response.ok) {
          const data = await response.json();

          // Salva o UUID devolvido pelo Python em um cookie de 30 dias para todo o domínio!
          const expiracao = new Date();
          expiracao.setTime(expiracao.getTime() + 30 * 24 * 60 * 60 * 1000);
          document.cookie = `visitor_uuid=${data.visitor_uuid}; expires=${expiracao.toUTCString()}; path=/; domain=.cevolu.com.br; SameSite=Lax; Secure`;
          console.log("Visita anônima registrada no banco com sucesso!");
        } else {
          const errorData = await response.json();
          console.error("O backend recusou a requisição. Status:", response.status, errorData);
        }
      } catch (error) {
        console.error("Erro ao salvar visitantes no backend:", error);
      }
    }
  }

  // Executa o nosso novo super rastreador
  gerenciarRastreio();

  // --- RESTANTE DAS SUAS FUNÇÕES (Intactas) ---
  const navbar = document.querySelector(".navbar");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  const reveals = document.querySelectorAll(".reveal");
  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const elementVisible = 100;
    reveals.forEach((reveal) => {
      const elementTop = reveal.getBoundingClientRect().top;
      if (elementTop < windowHeight - elementVisible) {
        reveal.classList.add("active");
      }
    });
  };
  window.addEventListener("scroll", revealOnScroll);
  revealOnScroll();
});
