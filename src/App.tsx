import Spreadsheet from "./components/spreadsheet";

function App() {
  return (
    <>
      <Spreadsheet config={{
        fontSize: 18,
        rows: 10
      }} />
    </>
  );
}

export default App;
