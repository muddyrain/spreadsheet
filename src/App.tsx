import Spreadsheet from "./components/spreadsheet";
function App() {
  return (
    <>
      <Spreadsheet config={{ rows: 1000, cols: 100 }} />
    </>
  );
}

export default App;
