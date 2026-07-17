// A simple test script utilizing Node's native fetch (Node 18+)
async function testGoogleToken(idToken) {
  console.log('Sending token to Google validation servers...');
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ Verification Successful!');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('\n❌ Verification Failed!', data);
    }
  } catch (error) {
    console.error('\n💥 Error communicating with Google:', error.message);
  }
}

// can use the mock bypass token or paste a real ID token here
const mockToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImJjOGY3YWY1OGRiNDRjZjZlYWEyZWQxMGVjODBmMzQwOGNmZGU0NjUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTU4MDczODAyNjQ2OTE2NTQwMTEiLCJhdF9oYXNoIjoiS2hwRWtkVGhjQmwtbGJiMElldnJvUSIsImlhdCI6MTc4NDE5NjgyNSwiZXhwIjoxNzg0MjAwNDI1fQ.aBtLnPAbLOn9OkD0fERe-g8ldLWLOy5RANPz31TtJWNE2JjUvAfWIItOhlyJS6kzakwsCyjFgZvi018ztyJebbKVvDhmXhiMMfLLvcPki8VTbIAHggAstxYManFJz_xM6fMljoZ4_9zr3lUa-2H0wCrh1EB_o3zEc3mLECIEoCHsklVNAyG9yC9iTAch1ZhK-N6Try6_xFzHj4gFK2UxT1FPukIC18D-OWYp2RypdhqDlR0yyjsjGaBgPSThKe0Edev1wHiDebACuCgJZ3-a80PoiRbhytmYmo7CkD3r-PGY2qAUwskvbPC_9mAj_kBjsR759DEXfq8IkH-QptGeag"; 
testGoogleToken(mockToken);