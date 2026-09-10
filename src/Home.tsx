import React, { useEffect, useState } from "react";
import axios from "axios";

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;

  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
  };

  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
}

const Home = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
      const fetchUsers= async () => {
        try {
          const response = await axios.get<User[]>("https://jsonplaceholder.typicode.com/users");
          setUsers(response.data);
        } catch (error) {
          console.log(error);
        }
      };

      fetchUsers();
  }, []);

  return (
    <div>
      <h2>Users List</h2>

      <table border={1} cellPadding={10} cellSpacing={0}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Company</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.phone}</td>

              <td>
                {user.address.street}, {user.address.suite}, {user.address.city}, {user.address.zipcode}
              </td>

              <td>
                {user.company.name} ({user.company.catchPhrase}) 
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Home;

