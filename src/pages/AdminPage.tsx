import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { migrateAllUsers } from '../utils/dataMigration';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export function AdminPage() {
  const { isAuthenticated, userData } = useAuth();
  const [jsonStorageId, setJsonStorageId] = useState<string>('');
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [migrationStatus, setMigrationStatus] = useState<string>('');

  // Check if user is admin (you can implement your own admin check)
  const isAdmin = isAuthenticated && userData?.email === 'admin@example.com'; // Replace with your admin email

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleMigration = async () => {
    if (!jsonStorageId) {
      toast.error('Please enter a jsonstorage.net bin ID');
      return;
    }

    setIsMigrating(true);
    setMigrationStatus('Starting migration...');

    try {
      await migrateAllUsers(jsonStorageId);
      setMigrationStatus('Migration completed successfully!');
      toast.success('Data migration completed successfully');
    } catch (error: any) {
      console.error('Migration error:', error);
      setMigrationStatus(`Migration failed: ${error.message}`);
      toast.error(`Migration failed: ${error.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <Tabs defaultValue="migration">
          <TabsList className="mb-4">
            <TabsTrigger value="migration">Data Migration</TabsTrigger>
            <TabsTrigger value="cache">Cache Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="migration">
            <Card>
              <CardHeader>
                <CardTitle>Data Migration</CardTitle>
                <CardDescription>
                  Migrate user data from jsonstorage.net to Firebase Firestore
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="jsonStorageId" className="text-sm font-medium">
                      jsonstorage.net Bin ID
                    </label>
                    <Input
                      id="jsonStorageId"
                      placeholder="Enter jsonstorage.net bin ID"
                      value={jsonStorageId}
                      onChange={(e) => setJsonStorageId(e.target.value)}
                    />
                  </div>

                  {migrationStatus && (
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                      <p className="text-sm">{migrationStatus}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleMigration} disabled={isMigrating}>
                  {isMigrating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Migrating...
                    </>
                  ) : (
                    'Start Migration'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="cache">
            <Card>
              <CardHeader>
                <CardTitle>Cache Management</CardTitle>
                <CardDescription>
                  Manage TMDB API cache in Firestore
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cache management features will be implemented in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  User management features will be implemented in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

export default AdminPage;
