import { fetchTokenVolume } from '../utils/coinGeckoVolume';
import 'dotenv/config';

async function VolumeTest() {
    try {
        // Test with a known token (e.g., bitcoin)
        const tokenId = 'bitcoin';
        const url = `https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=${tokenId}&include_24hr_vol=true&precision=5`;
        
        // Make raw fetch call to see full response
        const headers: Record<string, string> = {
            'accept': 'application/json',
            'x-cg-demo-api-key': process.env.COINGECKO_API_KEY as string
        };

        console.log('Making API call to:', url);
        const response = await fetch(url, { headers });
        const rawText = await response.text();
        
        console.log('\nResponse Status:', response.status);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
        console.log('\nRaw Response Body:', rawText);
        
        try {
            // Try parsing as JSON to see structured data
            const jsonData = JSON.parse(rawText);
            console.log('\nParsed JSON Response:', JSON.stringify(jsonData, null, 2));
        } catch (e) {
            console.log('Response is not valid JSON');
        }

        // Test the actual function
        console.log('\nTesting fetchTokenVolume function:');
        const result = await fetchTokenVolume(tokenId);
        console.log('fetchTokenVolume result:', result);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
VolumeTest().then(() => console.log('Test completed')); 