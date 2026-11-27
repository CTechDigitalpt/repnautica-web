/*
    ==========================================
    REPNÁUTICA LANDING LOADER
    ==========================================

    Flow:

    0–25%   Initialising
    25–50%  Preparing yard
    50–75%  Checking services
    75–95%  Preparing experience
    95–100% Entering website
    */


    const loader =
        document.getElementById("loader");

    const progressBar =
        document.getElementById("progressBar");

    const percentage =
        document.getElementById("percentage");

    const loadingText =
        document.getElementById("loadingText");


    if (loader && progressBar && percentage && loadingText) {

        const language = document.documentElement.lang.toLowerCase().startsWith("pt")
            ? "pt"
            : "en";

        const destination = loader.dataset.homePage
            || (language === "pt" ? "home-pt.html" : "home-en.html");


        const messages = language === "pt"
            ? [

                {
                    progress: 0,
                    text: "A INICIALIZAR"
                },

                {
                    progress: 25,
                    text: "A PREPARAR O ESTALEIRO"
                },

                {
                    progress: 50,
                    text: "A VERIFICAR OS SERVIÇOS"
                },

                {
                    progress: 75,
                    text: "A PREPARAR A EXPERIÊNCIA"
                },

                {
                    progress: 95,
                    text: "QUASE PRONTO"
                },

                {
                    progress: 100,
                    text: "BEM-VINDO À REPNÁUTICA"
                }

            ]
            : [

                {
                    progress: 0,
                    text: "INITIALISING"
                },

                {
                    progress: 25,
                    text: "PREPARING YARD"
                },

                {
                    progress: 50,
                    text: "CHECKING SERVICES"
                },

                {
                    progress: 75,
                    text: "PREPARING EXPERIENCE"
                },

                {
                    progress: 95,
                    text: "ALMOST READY"
                },

                {
                    progress: 100,
                    text: "WELCOME TO REPNÁUTICA"
                }

            ];


        let progress = 0;

        let redirectScheduled = false;


        function updateMessage(value) {

            let current =
                messages[0];

            messages.forEach(message => {

                if (value >= message.progress) {

                    current = message;

                }

            });

            loadingText.textContent =
                current.text;
        }


        function updateLoader() {

            progress +=
                Math.random() * 2.5;

            if (progress >= 100) {

                progress = 100;

            }

            const rounded =
                Math.floor(progress);

            progressBar.style.width =
                rounded + "%";

            percentage.textContent =
                rounded + "%";

            updateMessage(rounded);


            if (progress < 100) {

                requestAnimationFrame(
                    updateLoader
                );

            } else {

                finishLoading();

            }

        }


        function finishLoading() {

            if (redirectScheduled) {
                return;
            }

            redirectScheduled = true;


            progressBar.style.width = "100%";
            percentage.textContent = "100%";
            updateMessage(100);


            /*
            Small pause after 100%
            so the final state is visible.
            */

            setTimeout(() => {

                loader.classList.add("hide");

            }, 2500);


            /*
            Redirect to the actual website.

            For testing, comment this out
            if you don't have home.html yet.
            */

            setTimeout(() => {

                window.location.assign(destination);

            }, 1500);

        }


        /*
        Start after the browser has
        loaded the basic page.
        */

        window.addEventListener(
            "load",
            () => {

                setTimeout(
                    updateLoader,
                    300
                );

            }
        );
    }
