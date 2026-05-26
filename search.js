const fs = require('fs');
const path = require('path');

function search(dir, pattern) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            search(fullPath, pattern);
        } else if (fullPath.match(/\.(js|jsx|ts|tsx)$/)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(pattern)) {
                console.log(fullPath);
            }
        }
    }
}

search('c:/bianca/Trip Application/onTripe_frontend/src', 'Register your main travel agency');
