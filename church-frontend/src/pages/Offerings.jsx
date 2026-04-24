import { useEffect, useState } from "react";
import API from "../api/api";

function Offerings() {
  const [offerings, setOfferings] = useState([]);
  const [members, setMembers] = useState([]);
  const [amount, setAmount] = useState("");
  const [memberId, setMemberId] = useState("");

  const getData = () => {
    API.get("/offerings").then(res => setOfferings(res.data));
    API.get("/members").then(res => setMembers(res.data));
  };

  useEffect(() => {
    getData();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    API.post("/offerings", {
      amount: parseFloat(amount),
      member_id: parseInt(memberId),
    }).then(() => {
      setAmount("");
      setMemberId("");
      getData();
    });
  };

  return (
    <div>
      <h1>Ofrendas</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="Monto"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          <option value="">Seleccionar miembro</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <button type="submit">Guardar</button>
      </form>

      <ul>
        {offerings.map((o) => (
          <li key={o.id}>
            Q{o.amount} - Miembro ID: {o.member_id}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Offerings;