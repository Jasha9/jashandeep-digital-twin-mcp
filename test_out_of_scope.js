const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testOutOfScopeQuestions() {
  console.log('🧪 Testing Out-of-Scope Question Handling\n');
  
  const testQuestions = [
    {
      type: "Out-of-scope (Cooking)",
      question: "What's your favorite recipe for pasta?"
    },
    {
      type: "Out-of-scope (Sports)", 
      question: "Do you like playing football?"
    },
    {
      type: "Out-of-scope (Travel)",
      question: "What's the best vacation destination you've been to?"
    },
    {
      type: "Relevant (Education)",
      question: "What is your educational background and GPA?"
    },
    {
      type: "Relevant (Technical)",
      question: "What programming languages do you know?"
    }
  ];
  
  for (const test of testQuestions) {
    console.log(`\n🔍 Testing: ${test.type}`);
    console.log(`❓ Question: "${test.question}"`);
    console.log('⏳ Processing...\n');
    
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: test.question
        })
      });
      
      const data = await response.json();
      
      if (test.type.includes("Out-of-scope")) {
        if (data.response && data.response.includes("not something I have experience with")) {
          console.log('✅ CORRECT: Out-of-scope redirect response');
        } else {
          console.log('❌ ISSUE: Should have redirected but didn\'t');
        }
      } else {
        if (data.response && (data.response.includes("6.17") || data.response.includes("GPA") || data.response.includes("programming"))) {
          console.log('✅ CORRECT: Relevant response with appropriate content');
        } else {
          console.log('❌ ISSUE: Relevant question not handled properly');
        }
      }
      
      console.log(`📝 Response: ${data.response?.substring(0, 150)}...`);
      console.log(`📊 Sources: ${data.sources?.length || 0}`);
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
    
    console.log('-'.repeat(80));
  }
}

// Run test
testOutOfScopeQuestions().then(() => {
  console.log('\n🎯 Out-of-scope question handling tests completed!');
  process.exit(0);
}).catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});