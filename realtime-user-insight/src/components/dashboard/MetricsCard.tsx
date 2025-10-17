import { Card, CardContent } from "@/components/ui/card";

interface Props {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
}

const MetricsCard = ({ title, value, icon }: Props) => {
  return (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-4 flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-semibold">{value}</p>
        </div>
        {icon && <div className="text-blue-500 bg-blue-100 p-2 rounded-lg">{icon}</div>}
      </CardContent>
    </Card>
  );
};

export default MetricsCard;
