#import <UserNotifications/UNUserNotificationCenter.h>

#import <React/RCTBridgeDelegate.h>
#import <UIKit/UIKit.h>
#import <PushKit/PushKit.h>                    /* <------ add this line */


@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate, PKPushRegistryDelegate, UNUserNotificationCenterDelegate>


@property (nonatomic, strong) UIWindow *window;


@end
