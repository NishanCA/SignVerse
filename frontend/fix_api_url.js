const fs = require('fs');
const path = require('path');

const files = ['app/conversation/page.tsx', 'app/settings/page.tsx'];
for (const file of files) {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) continue;
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace: "process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'/api/..."
    content = content.replace(/\"process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:8000'(\/[^\"]*)\"/g, "`\\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}$1`");
    
    // Replace standalone: "process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'"
    content = content.replace(/\"process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:8000'\"/g, "(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')");
    
    fs.writeFileSync(fullPath, content);
}
console.log('Fixed syntax!');
