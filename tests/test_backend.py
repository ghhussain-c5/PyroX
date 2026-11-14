import asyncio
import json
import os
import unittest
from unittest.mock import patch
import httpx
from fastapi.testclient import TestClient
from backend.main import app, execute_tool, AnalysisRequest, run_agent

PAYLOAD = {'scenario': {'material': 'sibal', 'gravity': 'microgravity', 'oxygen': 21,
                       'airflow': 5, 'pressure': 101.3},
           'question': 'What is missing?', 'study_id': 'sibal'}

class BackendTests(unittest.TestCase):
    def test_missing_key_and_bad_inputs(self):
        client = TestClient(app)
        with patch.dict(os.environ, {'OPENAI_API_KEY': '', 'OPENAI_MODEL': ''}):
            self.assertFalse(client.get('/api/health').json()['ai_ready'])
            self.assertEqual(client.post('/api/analyze', json=PAYLOAD).status_code, 503)
        bad = {**PAYLOAD, 'scenario': {**PAYLOAD['scenario'], 'oxygen': 200}}
        self.assertEqual(client.post('/api/analyze', json=bad).status_code, 422)

    def test_tool_boundaries(self):
        result, source = execute_tool('get_test_records', {'study_id': 'sibal'})
        self.assertEqual(result['total'], 27)
        self.assertEqual(source['id'], 'sibal')
        self.assertIsNone(execute_tool('run_shell', {'study_id': 'sibal'})[1])
        self.assertIn('error', execute_tool('get_evidence', {'study_id': '../../x'})[0])

    def test_responses_tool_roundtrip(self):
        seen = []
        def transport(request):
            body = json.loads(request.content)
            seen.append(body)
            if len(seen) == 1:
                return httpx.Response(200, json={'status': 'completed', 'output': [{
                    'type': 'function_call', 'name': 'get_evidence', 'call_id': 'call_1',
                    'arguments': '{"study_id":"sibal"}'}]})
            self.assertEqual(body['input'][-1]['type'], 'function_call_output')
            return httpx.Response(200, json={'status': 'completed', 'output': [{
                'type': 'message', 'content': [{'type': 'output_text',
                'text': 'Observations: The table has 27 tests. [sibal]\nBlind spots: Flow endpoints do not provide time histories.'}]}]})
        async def go():
            async with httpx.AsyncClient(transport=httpx.MockTransport(transport)) as client:
                return await run_agent(AnalysisRequest(**PAYLOAD), client, 'test-placeholder', 'configured-model')
        result = asyncio.run(go())
        self.assertEqual(result['sources'][0]['id'], 'sibal')
        self.assertEqual(result['tools_used'], ['get_evidence:sibal'])
        self.assertFalse(seen[0]['store'])

if __name__ == '__main__':
    unittest.main()
