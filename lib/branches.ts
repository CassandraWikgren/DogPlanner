// app/lib/branches.ts

export type Branch = {
  id: string;
  name: string;
  color: string; // för etikettfärg
};

export const branches: Branch[] = [
  {
    id: "gothenburg",
    name: "Göteborg Hunddagis",
    color: "bg-blue-200 text-blue-800",
  },
  {
    id: "malmo",
    name: "Malmö Hunddagis",
    color: "bg-green-200 text-green-800",
  },
  {
    id: "stockholm",
    name: "Stockholm Hunddagis",
    color: "bg-yellow-200 text-yellow-800",
  },
];
