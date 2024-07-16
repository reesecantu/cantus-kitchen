import { useEffect, useState } from 'react';
import supabase from '../../../supabase/supabase-client';

type DynamicDropdownProps = {
    tableName: string;
    columnName: string;
};

function DynamicDropdown ({ tableName, columnName }: DynamicDropdownProps) {
    const [data, setData] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase
                .from(tableName as keyof typeof supabase.schema)
                .select(columnName)
                .ilike(columnName, `${searchTerm}%`);

            if (error) {
                console.error('Error fetching data:', error);
            } else {
                const columnData = data.map((item: any) => item[columnName]);
                setData(columnData);
            }
        };

        fetchData();
    }, [searchTerm]);

    return (
        <div>
            <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ul>
                {data.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </div>
    );
};

export default DynamicDropdown;