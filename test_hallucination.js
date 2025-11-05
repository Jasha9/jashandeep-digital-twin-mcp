import fetch from 'node-fetch';

const testQuestions = [
    "Tell me about your educational background",
    "What university did you attend?", 
    "Do you have a masters degree?",
    "What degrees do you have?",
    "Where did you study?"
];

async function testDigitalTwin() {
    console.log('🧪 TESTING ANTI-HALLUCINATION FIXES...');
    console.log('=' * 50);
    
    for (const question of testQuestions) {
        console.log(`\n❓ Question: ${question}`);
        
        try {
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: question })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log(`✅ Response: ${data.response}`);
                
                // Check for problematic terms
                const responseText = data.response.toLowerCase();
                if (responseText.includes('edinburgh') || (responseText.includes('masters') && responseText.includes('degree'))) {
                    console.log('❌ STILL HALLUCINATING INCORRECT INFO!');
                } else if (responseText.includes('victoria university') || responseText.includes('bachelor')) {
                    console.log('✅ Correct information provided');
                } else {
                    console.log('ℹ️  Response doesn\'t mention specific education details');
                }
            } else {
                console.log(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            console.log(`❌ Request failed: ${error.message}`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

testDigitalTwin().catch(console.error);