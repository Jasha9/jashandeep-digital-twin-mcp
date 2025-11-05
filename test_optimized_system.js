const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testOptimizedSystem() {
  console.log('🚀 Testing Optimized 3-Source Digital Twin System\n');
  
  // Test education query
  console.log('Testing education query...');
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: "What is your educational background and academic achievements?"
      })
    });
    
    const data = await response.json();
    console.log('✅ Education Response:', data.response);
    console.log('📊 Sources:', data.sources?.length || 0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testOptimizedSystem().then(() => {
  console.log('\n✨ Test completed!');
  process.exit(0);
});