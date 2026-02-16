const fs = require('fs');
const path = require('path');

const src = 'c:/Projetos/PromptVS/app/assets/logo.png';
const dest = 'c:/Projetos/PromptVS/public/logo.png';

try {
    fs.copyFileSync(src, dest);
    console.log('Logo copiado com sucesso para a pasta public!');
} catch (err) {
    console.error('Erro ao copiar o logo:', err);
}
