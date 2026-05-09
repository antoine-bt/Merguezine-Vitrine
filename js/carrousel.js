document.addEventListener("DOMContentLoaded", () => new Carrousel());

class Carrousel {
    constructor() {
        this.track         = document.getElementById("carouselTrack");
        this.dotsContainer = document.getElementById("carouselDots");
        this.btnGauche     = document.getElementById("btnGauche");
        this.btnDroite     = document.getElementById("btnDroite");
        this.indexActif    = -1;
        this.cartes        = [];
        this.isScrolling   = false;
        this.scrollTimer   = null;
        this.scrollLockTimer = null;

        this.initialiser();
    }

    async initialiser() {
        const manifest = await fetch("mangas-carrousel/manifest.json").then(r => r.json());
        for (const [i, nom] of manifest.entries()) {
            await this.creerCarte(nom, i);
        }
        this.attacherEvenements();
    }

    async creerCarte(nom, index) {
        const html = await fetch(`mangas-carrousel/${nom}/carte.html`).then(r => r.text());

        const carte = document.createElement("div");
        carte.classList.add("carte");
        carte.innerHTML = html;
        this.track.appendChild(carte);
        this.cartes.push(carte);

        const dot = document.createElement("div");
        dot.classList.add("dot");
        dot.addEventListener("click", () => this.allerA(index));
        this.dotsContainer.appendChild(dot);

        carte.addEventListener("click", () => this.allerA(index));
    }

    attacherEvenements() {
        this.btnGauche?.addEventListener("click", () =>
            this.allerA(this.indexActif === -1 ? 0 : this.indexActif - 1)
        );
        this.btnDroite?.addEventListener("click", () =>
            this.allerA(this.indexActif === -1 ? 0 : this.indexActif + 1)
        );

        this.track.addEventListener("touchstart", e => {
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        this.track.addEventListener("touchend", e => {
            const delta = this.touchStartY - e.changedTouches[0].clientY;
            const depuisDebut = this.indexActif === -1 ? 0 : this.indexActif;
            if (Math.abs(delta) > 40) {
                this.allerA(depuisDebut + (delta > 0 ? 1 : -1));
            }
        }, { passive: true });

        window.addEventListener("scroll", () => this.onScroll(), { passive: true });
        window.addEventListener("resize", () => this.mettreAJour());
    }

    onScroll() {
        if (this.isScrolling) return;

        clearTimeout(this.scrollTimer);
        this.scrollTimer = setTimeout(() => {
            const nouvelIndex = this.carteCentree();
            if (nouvelIndex !== this.indexActif) {
                this.indexActif = nouvelIndex;
                this.mettreAJour();
            }
        }, 80);
    }

    carteCentree() {
        const milieuEcran = window.innerHeight / 2;

        return this.cartes.reduce((indexProche, carte, i) => {
            const rect        = carte.getBoundingClientRect();
            const milieuCarte = rect.top + rect.height / 2;
            const distance    = Math.abs(milieuCarte - milieuEcran);

            const rectProche      = this.cartes[indexProche].getBoundingClientRect();
            const milieuProche    = rectProche.top + rectProche.height / 2;
            const distanceProche  = Math.abs(milieuProche - milieuEcran);

            return distance < distanceProche ? i : indexProche;
        }, 0);
    }

    centrerCarte(carte) {
        const rect        = carte.getBoundingClientRect();
        const milieuCarte = rect.top + window.scrollY + rect.height / 2;
        const cible       = milieuCarte - window.innerHeight / 2;
        window.scrollTo({ top: cible, behavior: "smooth" });
    }

    allerA(index) {
        this.indexActif  = (index + this.cartes.length) % this.cartes.length;
        this.isScrolling = true;

        this.mettreAJour();
        this.centrerCarte(this.cartes[this.indexActif]);

        clearTimeout(this.scrollLockTimer);
        this.scrollLockTimer = setTimeout(() => { this.isScrolling = false; }, 600);
    }

    classeParDistance(d) {
        const classes = ["active", "proche", "loin", "cache"];
        const index   = Math.abs(d) >= 3 ? 3 : Math.abs(d);
        return classes[index];
    }

    mettreAJour() {
        const total = this.cartes.length;

        this.cartes.forEach((carte, i) => {
            carte.classList.remove("active", "proche", "loin", "cache");
            carte.style.transform = "";
            carte.style.opacity   = "";
            carte.style.zIndex    = "";

            if (this.indexActif !== -1) {
                const diff = ((i - this.indexActif) % total + total) % total;
                const d    = diff > total / 2 ? diff - total : diff;
                carte.classList.add(this.classeParDistance(d));
            }
        });

        this.dotsContainer.querySelectorAll(".dot").forEach((dot, i) => {
            dot.classList.toggle("active", i === this.indexActif);
        });
    }
}