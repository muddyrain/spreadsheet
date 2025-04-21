import Spreadsheet from "./components/spreadsheet";

function App() {
  return (
    <>
      <Spreadsheet config={{
        fontSize: 18,
        rows: 200
      }} />
    </>
  );
}

export default App;
