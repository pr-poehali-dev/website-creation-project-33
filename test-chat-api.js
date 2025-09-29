// Test script for chat API endpoint
const url = 'https://functions.poehali.dev/cad0f9c1-a7f9-476f-b300-29e671bbaa2c';

fetch(url, {
  method: 'GET',
  headers: {
    'X-User-Id': '1'
  }
})
  .then(response => {
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('\nResponse Headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    return response.text();
  })
  .then(body => {
    console.log('\nResponse Body:');
    try {
      const json = JSON.parse(body);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(body);
    }
  })
  .catch(error => {
    console.error('Error:', error.message);
  });