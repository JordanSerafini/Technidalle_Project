import React, { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { Card, IconButton, Menu } from 'react-native-paper';
import { Client } from '@/app/utils/interfaces/client.interface';
import { formatClientData } from '@/app/utils/formatClientData';

interface ClientCardProps {
  client: Client;
  onCallPress: (client: Client) => void;
  onDetailPress: (client: Client) => void;
}

const ClientCard = React.memo(({ client, onCallPress, onDetailPress }: ClientCardProps) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { displayName, hasPhone, hasEmail } = formatClientData(client);

  const openMenu = useCallback(() => setMenuVisible(true), []);
  const closeMenu = useCallback(() => setMenuVisible(false), []);

  const handleCall = useCallback(() => {
    closeMenu();
    onCallPress(client);
  }, [client, onCallPress, closeMenu]);

  const handleDetail = useCallback(() => {
    closeMenu();
    onDetailPress(client);
  }, [client, onDetailPress, closeMenu]);

  return (
    <Card mode="outlined" className="mb-2" onPress={handleDetail}>
      <Card.Title
        title={displayName}
        titleStyle={{ fontWeight: 'bold' }}
        right={(props) => (
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={<IconButton {...props} icon="dots-vertical" onPress={openMenu} />}
          >
            {hasPhone && <Menu.Item onPress={handleCall} title="Appeler" />}
            <Menu.Item onPress={handleDetail} title="Voir fiche" />
          </Menu>
        )}
      />
      {(hasPhone || hasEmail) && (
        <Card.Content>
          {hasPhone && (
            <Text className="text-xs text-gray-700" numberOfLines={1}>
              {client.phone || client.mobile}
            </Text>
          )}
          {hasEmail && (
            <Text className="text-xs text-gray-700" numberOfLines={1}>
              {client.email}
            </Text>
          )}
        </Card.Content>
      )}
    </Card>
  );
}, (prev, next) => prev.client.id === next.client.id);

export default ClientCard;
