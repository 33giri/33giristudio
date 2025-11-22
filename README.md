# 33Giri Multi-Page Project

## Overview
The 33Giri Multi-Page project is a website dedicated to showcasing unique vinyl-based design objects. The site features a clean and modern design, allowing users to explore various sections including a quiz to find their perfect vinyl, collaborations with artists, and a product catalog.

## Project Structure
The project is organized into several key files and directories:

- **index.html**: The main landing page that introduces the website and provides links to other sections.
- **quiz.html**: A dedicated page for the quiz feature, where users can answer questions to discover their ideal vinyl.
- **collaborazioni.html**: This page highlights collaborations with various artists, showcasing their work and providing descriptions.
- **catalogo.html**: A catalog page that displays different vinyl designs available for purchase.
- **assets/**: Contains all the assets for the website, including styles and scripts.
  - **css/styles.css**: The main stylesheet for the website, defining layout, colors, and typography.
  - **js/main.js**: The primary JavaScript file for handling navigation and interactions across the site.
  - **js/quiz.js**: A script specifically for managing the quiz functionality, including question handling and result display.
  - **components/**: Contains reusable HTML components.
    - **header.html**: The header structure used across multiple pages for consistency.
    - **footer.html**: The footer structure ensuring a uniform look across all pages.
- **data/content.js**: A JavaScript file that holds content data for the website, such as product information and artist details, which can be dynamically loaded into the HTML pages.
- **README.md**: This documentation file, providing an overview of the project and setup instructions.

## Features
- **Responsive Design**: The website is designed to be fully responsive, ensuring a seamless experience across devices.
- **Dynamic Content**: Content is loaded dynamically from the `data/content.js` file, allowing for easy updates and maintenance.
- **Interactive Quiz**: Users can engage with an interactive quiz to find the vinyl that best matches their personality and preferences.
- **Artist Collaborations**: The site showcases unique collaborations with artists, providing insights into their creative processes and works.

## Setup Instructions
1. Clone the repository to your local machine.
2. Open the `index.html` file in your web browser to view the landing page.
3. Navigate through the links to explore the quiz, collaborations, and catalog sections.
4. Ensure that all assets are correctly linked for styles and scripts to function properly.

## Email di conferma registrazione (EmailJS)
Per inviare una mail di conferma dopo la registrazione, il progetto utilizza EmailJS lato client.

Passi per configurare:
- Crea un account su https://www.emailjs.com/.
- Crea un Service (es: Gmail/SMTP) e annota il `Service ID`.
- Crea un Template (inserisci variabili come `to_email`, `subject`, `message`, `site_name`, `site_url`) e annota il `Template ID`.
- Vai nelle Account Settings e recupera il `Public Key` (chiamato anche `Public API Key`).
- Apri `assets/js/account.js` e sostituisci i placeholder:
  - `REPLACE_WITH_EMAILJS_PUBLIC_KEY`
  - `REPLACE_WITH_EMAILJS_SERVICE_ID`
  - `REPLACE_WITH_EMAILJS_TEMPLATE_ID`

Note:
- Lo script SDK di EmailJS viene caricato in `account.html` prima di `assets/js/account.js`.
- Se le chiavi non sono impostate, la registrazione funzionerà comunque ma l'invio email verrà saltato (log in console). 
- Dopo la registrazione, l'utente viene reindirizzato automaticamente alla `index.html`.

### Troubleshooting invio email
- Evita di aprire le pagine come `file://...`. EmailJS richiede un'origine HTTP/HTTPS.
- Avvia un server locale, ad esempio:
  - Python: `python3 -m http.server 8000`
  - Node (serve): `npx serve -l 8000`
  Poi apri `http://localhost:8000/`.
- Nella dashboard EmailJS aggiungi i domini consentiti (Allowed Origins):
  - `http://localhost:8000` (o la porta che usi)
  - `http://127.0.0.1:8000` (facoltativo)
  - Il tuo dominio di produzione
- Se l'errore contiene "origin not allowed", significa che il dominio non è nella whitelist.

## Contribution
Contributions to the project are welcome. Please feel free to submit issues or pull requests for any enhancements or bug fixes.# 33giristudio.it
