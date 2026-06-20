const fs = require('fs');
const path = require('path');

const files = ['app/conversation/page.tsx', 'app/settings/page.tsx'];
for (const file of files) {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) continue;
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace: "process.env.NEXT_PUBLIC_API_URL/api/..."
    content = content.replace(/\"process\.env\.NEXT_PUBLIC_API_URL(\/[^\"]*)\"/g, "`\\${process.env.NEXT_PUBLIC_API_URL}$1`");
    
    // Replace standalone: "process.env.NEXT_PUBLIC_API_URL"
    content = content.replace(/\"process\.env\.NEXT_PUBLIC_API_URL\"/g, "process.env.NEXT_PUBLIC_API_URL");
    
    fs.writeFileSync(fullPath, content);
}
console.log('Fixed syntax!');
