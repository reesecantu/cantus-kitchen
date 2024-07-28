import { jwtDecode } from 'jwt-decode'

function TestingPage() {
  return (
    <>
    <h1>Testing page</h1>
    <button onClick={() => jwtDecode("")}>try to decode nothing</button>
    </>
  )
}

export default TestingPage